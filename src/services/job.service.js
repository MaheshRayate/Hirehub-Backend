import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

export const createJob = async ({
  userId,
  title,
  description,
  companyId,
  location,
  employmentType,
  experienceMin,
  experienceMax,
  salaryMin,
  salaryMax,
  skills,
}) => {
  // 1. Find recruiter and their company
  const [recruiters] = await pool.execute(
    `SELECT
      id,
      company_id
     FROM recruiters
     WHERE user_id = ?`,
    [userId],
  );

  if (recruiters.length === 0) {
    throw new AppError("Recruiter profile not found", 404);
  }

  const recruiter = recruiters[0];

  // 2. Make sure recruiter belongs to this company
  if (recruiter.company_id !== Number(companyId)) {
    throw new AppError(
      "You are not authorized to create a job for this company",
      403,
    );
  }

  // 3. Create the job
  const [result] = await pool.execute(
    `INSERT INTO jobs (
      title,
      description,
      company_id,
      created_by,
      location,
      employment_type,
      experience_min,
      experience_max,
      salary_min,
      salary_max,
      skills
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      companyId,
      userId,
      location || null,
      employmentType,
      experienceMin ?? 0,
      experienceMax ?? null,
      salaryMin ?? null,
      salaryMax ?? null,
      skills || null,
    ],
  );

  // 4. Get the newly created job
  const [jobs] = await pool.execute(
    `SELECT
      id,
      title,
      description,
      company_id,
      created_by,
      location,
      employment_type,
      experience_min,
      experience_max,
      salary_min,
      salary_max,
      skills,
      status,
      created_at,
      updated_at
     FROM jobs
     WHERE id = ?`,
    [result.insertId],
  );

  return jobs[0];
};
