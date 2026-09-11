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
  vacancies,
  skills
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
      vacancies,
      skills
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
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
      vacancies ?? 1,
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

export const getAllJobs = async ({
  search,
  locations,
  experienceMin,
  experienceMax,
  salaryMin,
  salaryMax,
  freshness,
  sort = "newest",
  workMode,
  page = 1,
  limit = 10,
}) => {
  let whereQuery = `
    FROM jobs j

    INNER JOIN companies c
      ON j.company_id = c.id

    WHERE j.status = 'ACTIVE'
      AND c.status = 'APPROVED'
  `;

  const params = [];

  // Search
  if (search) {
    whereQuery += `
      AND (
        j.title LIKE ?
        OR j.skills LIKE ?
        OR j.location LIKE ?
        OR c.name LIKE ?
      )
    `;

    const searchValue = `%${search}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  // Location
  if (locations && locations.length > 0) {
    const locationConditions = locations.map(
      () => `j.location LIKE ?`
    );

    whereQuery += `
      AND (
        ${locationConditions.join(" OR ")}
      )
    `;

    locations.forEach((location) => {
      params.push(`%${location}%`);
    });
  }

  // Experience
  if (
    experienceMin !== undefined &&
    experienceMax !== undefined
  ) {
    whereQuery += `
      AND j.experience_max >= ?
      AND j.experience_min <= ?
    `;

    params.push(
      experienceMin,
      experienceMax
    );
  } else if (experienceMin !== undefined) {
    whereQuery += `
      AND j.experience_max >= ?
    `;

    params.push(experienceMin);
  } else if (experienceMax !== undefined) {
    whereQuery += `
      AND j.experience_min <= ?
    `;

    params.push(experienceMax);
  }

  // Salary
  if (
    salaryMin !== undefined &&
    salaryMax !== undefined
  ) {
    whereQuery += `
      AND j.salary_max >= ?
      AND j.salary_min <= ?
    `;

    params.push(
      salaryMin,
      salaryMax
    );
  } else if (salaryMin !== undefined) {
    whereQuery += `
      AND j.salary_max >= ?
    `;

    params.push(salaryMin);
  } else if (salaryMax !== undefined) {
    whereQuery += `
      AND j.salary_min <= ?
    `;

    params.push(salaryMax);
  }

  // Freshness
  if (freshness !== undefined) {
    whereQuery += `
      AND j.created_at >= DATE_SUB(
        NOW(),
        INTERVAL ${freshness} DAY
      )
    `;
  }

  // Work mode
  if (workMode) {
    whereQuery += `
      AND j.work_mode = ?
    `;

    params.push(workMode);
  }

  // --------------------------------
  // Count matching jobs
  // --------------------------------

  const [countResult] = await pool.execute(
    `SELECT COUNT(*) AS total
     ${whereQuery}`,
    params
  );

  const total = Number(countResult[0].total);

  // --------------------------------
  // Pagination
  // --------------------------------

  const offset = (page - 1) * limit;

  // --------------------------------
  // Sorting
  // --------------------------------

  const sortOptions = {
    newest: "j.created_at DESC",
    oldest: "j.created_at ASC",
    salary_high: "j.salary_max DESC",
    salary_low: "j.salary_min ASC",
  };

  const orderBy =
    sortOptions[sort] || sortOptions.newest;

  // --------------------------------
  // Fetch jobs
  // --------------------------------

  const [jobs] = await pool.execute(
    `SELECT
      j.id,
      j.title,
      j.description,
      j.vacancies,
      j.location,
      j.work_mode,
      j.employment_type,
      j.experience_min,
      j.experience_max,
      j.salary_min,
      j.salary_max,
      j.skills,
      j.education,
      j.status,
      j.created_at,
      j.updated_at,

      c.id AS company_id,
      c.name AS company_name,
      c.logo AS company_logo,
      c.location AS company_location

     ${whereQuery}

     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [
      ...params,
      limit,
      offset,
    ]
  );

  const totalPages =
    Math.ceil(total / limit);

  return {
    jobs,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};