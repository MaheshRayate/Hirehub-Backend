import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

export const getJobSeekerProfile = async (userId) => {
  const [jobSeekers] = await pool.execute(
    `SELECT
      id,
      user_id,
      bio,
      resume_url,
      work_status,
      experience_years,
      experience_months,
      current_city,
      current_annual_salary,
      availability_to_join,
      current_industry,
      current_job_role,
      linkedin_url,
      portfolio_url,
      created_at,
      updated_at
     FROM job_seekers
     WHERE user_id = ?`,
    [userId],
  );

  if (jobSeekers.length === 0) {
    throw new AppError("Job seeker profile not found", 404);
  }

  return jobSeekers[0];
};

export const updateJobSeekerProfile = async (userId, data) => {
  const {
    bio,
    workStatus,
    experienceYears,
    experienceMonths,
    currentCity,
    currentAnnualSalary,
    availabilityToJoin,
    currentIndustry,
    currentJobRole,
    linkedinUrl,
    portfolioUrl,
  } = data;

  const [result] = await pool.execute(
    `UPDATE job_seekers
     SET
       bio = ?,
       work_status = ?,
       experience_years = ?,
       experience_months = ?,
       current_city = ?,
       current_annual_salary = ?,
       availability_to_join = ?,
       current_industry = ?,
       current_job_role = ?,
       linkedin_url = ?,
       portfolio_url = ?
     WHERE user_id = ?`,
    [
      bio,
      workStatus,
      experienceYears,
      experienceMonths,
      currentCity,
      currentAnnualSalary,
      availabilityToJoin,
      currentIndustry,
      currentJobRole,
      linkedinUrl,
      portfolioUrl,
      userId,
    ],
  );

  if (result.affectedRows === 0) {
    throw new AppError("Job seeker profile not found", 404);
  }

  return getJobSeekerProfile(userId);
};

export const getJobSeekerPreferences = async (userId) => {
  const [jobSeekers] = await pool.execute(
    `SELECT id
     FROM job_seekers
     WHERE user_id = ?`,
    [userId],
  );

  if (jobSeekers.length === 0) {
    throw new AppError("Job seeker profile not found", 404);
  }

  const jobSeekerId = jobSeekers[0].id;

  const [preferences] = await pool.execute(
    `SELECT
       expected_annual_salary,
       job_type
     FROM job_seeker_preferences
     WHERE job_seeker_id = ?`,
    [jobSeekerId],
  );

  const [roles] = await pool.execute(
    `SELECT role
     FROM job_seeker_preferred_roles
     WHERE job_seeker_id = ?
     ORDER BY id ASC`,
    [jobSeekerId],
  );

  const [locations] = await pool.execute(
    `SELECT location
     FROM job_seeker_preferred_locations
     WHERE job_seeker_id = ?
     ORDER BY id ASC`,
    [jobSeekerId],
  );

  return {
    expectedAnnualSalary:
      preferences.length > 0 ? preferences[0].expected_annual_salary : null,

    jobType: preferences.length > 0 ? preferences[0].job_type : null,

    preferredRoles: roles.map((item) => item.role),

    preferredLocations: locations.map((item) => item.location),
  };
};

export const updateJobSeekerPreferences = async (userId, data) => {
  const {
    expectedAnnualSalary,
    jobType,
    preferredRoles = [],
    preferredLocations = [],
  } = data;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [jobSeekers] = await connection.execute(
      `SELECT id
       FROM job_seekers
       WHERE user_id = ?`,
      [userId],
    );

    if (jobSeekers.length === 0) {
      throw new AppError("Job seeker profile not found", 404);
    }

    const jobSeekerId = jobSeekers[0].id;

    // 1. Update basic preferences
    await connection.execute(
      `INSERT INTO job_seeker_preferences
        (job_seeker_id, expected_annual_salary, job_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
        expected_annual_salary = VALUES(expected_annual_salary),
        job_type = VALUES(job_type)`,
      [jobSeekerId, expectedAnnualSalary ?? null, jobType ?? null],
    );

    // 2. Replace preferred roles
    await connection.execute(
      `DELETE FROM job_seeker_preferred_roles
       WHERE job_seeker_id = ?`,
      [jobSeekerId],
    );

    for (const role of preferredRoles) {
      await connection.execute(
        `INSERT INTO job_seeker_preferred_roles
          (job_seeker_id, role)
         VALUES (?, ?)`,
        [jobSeekerId, role],
      );
    }

    // 3. Replace preferred locations
    await connection.execute(
      `DELETE FROM job_seeker_preferred_locations
       WHERE job_seeker_id = ?`,
      [jobSeekerId],
    );

    for (const location of preferredLocations) {
      await connection.execute(
        `INSERT INTO job_seeker_preferred_locations
          (job_seeker_id, location)
         VALUES (?, ?)`,
        [jobSeekerId, location],
      );
    }

    await connection.commit();

    return getJobSeekerPreferences(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getJobSeekerSkills = async (userId) => {
  const [jobSeekers] = await pool.execute(
    `SELECT id
     FROM job_seekers
     WHERE user_id = ?`,
    [userId],
  );

  if (jobSeekers.length === 0) {
    throw new AppError("Job seeker profile not found", 404);
  }

  const jobSeekerId = jobSeekers[0].id;

  const [skills] = await pool.execute(
    `SELECT
       s.id,
       s.name
     FROM job_seeker_skills jss
     INNER JOIN skills s
       ON s.id = jss.skill_id
     WHERE jss.job_seeker_id = ?
     ORDER BY s.name ASC`,
    [jobSeekerId],
  );

  return skills;
};

// Update logged-in job seeker's skills
export const updateJobSeekerSkills = async (
  userId,
  skillIds
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Find job seeker
    const [jobSeekers] = await connection.execute(
      `SELECT id
       FROM job_seekers
       WHERE user_id = ?`,
      [userId]
    );

    if (jobSeekers.length === 0) {
      throw new AppError(
        "Job seeker profile not found",
        404
      );
    }

    const jobSeekerId = jobSeekers[0].id;

    // Remove existing skill relationships
    await connection.execute(
      `DELETE FROM job_seeker_skills
       WHERE job_seeker_id = ?`,
      [jobSeekerId]
    );

    // If no skills were selected,
    // the profile simply has no skills.
    if (skillIds.length === 0) {
      await connection.commit();

      return getJobSeekerSkills(userId);
    }

    // Check that all skill IDs exist
    const placeholders = skillIds
      .map(() => "?")
      .join(", ");

    const [skills] = await connection.execute(
      `SELECT id
       FROM skills
       WHERE id IN (${placeholders})`,
      skillIds
    );

    if (skills.length !== skillIds.length) {
      throw new AppError(
        "One or more skills are invalid",
        400
      );
    }

    // Insert relationships
    for (const skillId of skillIds) {
      await connection.execute(
        `INSERT INTO job_seeker_skills
          (job_seeker_id, skill_id)
         VALUES (?, ?)`,
        [jobSeekerId, skillId]
      );
    }

    await connection.commit();

    return getJobSeekerSkills(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


// This skills dont belong to the user these skills are the master list of available skills

export const getAllSkills = async () => {
  const [skills] = await pool.execute(
    `SELECT
       id,
       name
     FROM skills
     ORDER BY name ASC`
  );

  return skills;
};

export const getJobSeekerEmployment = async (userId) => {
  const [employment] = await pool.execute(
    `SELECT
       e.id,
       e.is_current,
       e.company_name,
       e.employment_type,
       e.joining_date,
       e.leaving_date,
       e.current_annual_salary,
       e.job_role,
       e.created_at,
       e.updated_at
     FROM job_seeker_employment e
     INNER JOIN job_seekers js
       ON js.id = e.job_seeker_id
     WHERE js.user_id = ?
     ORDER BY e.is_current DESC, e.joining_date DESC`,
    [userId]
  );

  return employment;
};

export const addJobSeekerEmployment = async (
  userId,
  data
) => {
  const {
    isCurrent,
    companyName,
    employmentType,
    joiningDate,
    leavingDate,
    currentAnnualSalary,
    jobRole,
  } = data;

  const [jobSeekers] = await pool.execute(
    `SELECT id
     FROM job_seekers
     WHERE user_id = ?`,
    [userId]
  );

  if (jobSeekers.length === 0) {
    throw new AppError(
      "Job seeker profile not found",
      404
    );
  }

  const jobSeekerId = jobSeekers[0].id;

  // Only one current employment is allowed
  if (isCurrent === true) {
    const [currentEmployment] = await pool.execute(
      `SELECT id
       FROM job_seeker_employment
       WHERE job_seeker_id = ?
       AND is_current = TRUE`,
      [jobSeekerId]
    );

    if (currentEmployment.length > 0) {
      throw new AppError(
        "You already have a current employment record",
        400
      );
    }
  }

  const [result] = await pool.execute(
    `INSERT INTO job_seeker_employment (
       job_seeker_id,
       is_current,
       company_name,
       employment_type,
       joining_date,
       leaving_date,
       current_annual_salary,
       job_role
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jobSeekerId,
      isCurrent,
      companyName,
      employmentType,
      joiningDate,
      isCurrent ? null : leavingDate,
      isCurrent ? currentAnnualSalary : null,
      jobRole,
    ]
  );

  const [rows] = await pool.execute(
    `SELECT
       id,
       is_current,
       company_name,
       employment_type,
       joining_date,
       leaving_date,
       current_annual_salary,
       job_role,
       created_at,
       updated_at
     FROM job_seeker_employment
     WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
};

export const updateJobSeekerEmployment = async (
  userId,
  employmentId,
  data
) => {
  const {
    isCurrent,
    companyName,
    employmentType,
    joiningDate,
    leavingDate,
    currentAnnualSalary,
    jobRole,
  } = data;

  const [records] = await pool.execute(
    `SELECT e.id
     FROM job_seeker_employment e
     INNER JOIN job_seekers js
       ON js.id = e.job_seeker_id
     WHERE e.id = ?
     AND js.user_id = ?`,
    [employmentId, userId]
  );

  if (records.length === 0) {
    throw new AppError(
      "Employment record not found",
      404
    );
  }

  if (isCurrent === true) {
    const [currentEmployment] = await pool.execute(
      `SELECT id
       FROM job_seeker_employment
       WHERE job_seeker_id = (
         SELECT job_seeker_id
         FROM job_seeker_employment
         WHERE id = ?
       )
       AND is_current = TRUE
       AND id != ?`,
      [employmentId, employmentId]
    );

    if (currentEmployment.length > 0) {
      throw new AppError(
        "You already have another current employment record",
        400
      );
    }
  }

  await pool.execute(
    `UPDATE job_seeker_employment
     SET
       is_current = ?,
       company_name = ?,
       employment_type = ?,
       joining_date = ?,
       leaving_date = ?,
       current_annual_salary = ?,
       job_role = ?
     WHERE id = ?`,
    [
      isCurrent,
      companyName,
      employmentType,
      joiningDate,
      isCurrent ? null : leavingDate,
      isCurrent ? currentAnnualSalary : null,
      jobRole,
      employmentId,
    ]
  );

  const [updated] = await pool.execute(
    `SELECT
       id,
       is_current,
       company_name,
       employment_type,
       joining_date,
       leaving_date,
       current_annual_salary,
       job_role,
       created_at,
       updated_at
     FROM job_seeker_employment
     WHERE id = ?`,
    [employmentId]
  );

  return updated[0];
};

export const deleteJobSeekerEmployment = async (
  userId,
  employmentId
) => {
  const [result] = await pool.execute(
    `DELETE e
     FROM job_seeker_employment e
     INNER JOIN job_seekers js
       ON js.id = e.job_seeker_id
     WHERE e.id = ?
     AND js.user_id = ?`,
    [employmentId, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError(
      "Employment record not found",
      404
    );
  }
};

export const getJobSeekerProjects = async (userId) => {
  const [projects] = await pool.execute(
    `SELECT
       p.id,
       p.title,
       p.description,
       p.created_at,
       p.updated_at
     FROM job_seeker_projects p
     INNER JOIN job_seekers js
       ON js.id = p.job_seeker_id
     WHERE js.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return projects;
};

export const addJobSeekerProject = async (
  userId,
  data
) => {
  const {
    title,
    description,
  } = data;

  const [jobSeekers] = await pool.execute(
    `SELECT id
     FROM job_seekers
     WHERE user_id = ?`,
    [userId]
  );

  if (jobSeekers.length === 0) {
    throw new AppError(
      "Job seeker profile not found",
      404
    );
  }

  const jobSeekerId = jobSeekers[0].id;

  const [result] = await pool.execute(
    `INSERT INTO job_seeker_projects (
       job_seeker_id,
       title,
       description
     )
     VALUES (?, ?, ?)`,
    [
      jobSeekerId,
      title,
      description,
    ]
  );

  const [projects] = await pool.execute(
    `SELECT
       id,
       title,
       description,
       created_at,
       updated_at
     FROM job_seeker_projects
     WHERE id = ?`,
    [result.insertId]
  );

  return projects[0];
};

export const updateJobSeekerProject = async (
  userId,
  projectId,
  data
) => {
  const {
    title,
    description,
  } = data;

  const [projects] = await pool.execute(
    `SELECT p.id
     FROM job_seeker_projects p
     INNER JOIN job_seekers js
       ON js.id = p.job_seeker_id
     WHERE p.id = ?
     AND js.user_id = ?`,
    [projectId, userId]
  );

  if (projects.length === 0) {
    throw new AppError(
      "Project not found",
      404
    );
  }

  await pool.execute(
    `UPDATE job_seeker_projects
     SET
       title = ?,
       description = ?
     WHERE id = ?`,
    [
      title,
      description,
      projectId,
    ]
  );

  const [updatedProjects] = await pool.execute(
    `SELECT
       id,
       title,
       description,
       created_at,
       updated_at
     FROM job_seeker_projects
     WHERE id = ?`,
    [projectId]
  );

  return updatedProjects[0];
};

export const deleteJobSeekerProject = async (
  userId,
  projectId
) => {
  const [result] = await pool.execute(
    `DELETE p
     FROM job_seeker_projects p
     INNER JOIN job_seekers js
       ON js.id = p.job_seeker_id
     WHERE p.id = ?
     AND js.user_id = ?`,
    [projectId, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError(
      "Project not found",
      404
    );
  }
};

export const getJobSeekerEducation = async (userId) => {
  const [education] = await pool.execute(
    `SELECT
       e.id,
       e.education_level,
       e.course,
       e.specialization,
       e.course_type,
       e.start_year,
       e.end_year,
       e.grading_system,
       e.grade_value,
       e.created_at,
       e.updated_at
     FROM job_seeker_education e
     INNER JOIN job_seekers js
       ON js.id = e.job_seeker_id
     WHERE js.user_id = ?
     ORDER BY e.end_year DESC`,
    [userId]
  );

  return education;
};

export const addJobSeekerEducation = async (
  userId,
  data
) => {
  const {
    educationLevel,
    course,
    specialization,
    courseType,
    startYear,
    endYear,
    gradingSystem,
    gradeValue,
  } = data;

  const [jobSeekers] = await pool.execute(
    `SELECT id
     FROM job_seekers
     WHERE user_id = ?`,
    [userId]
  );

  if (jobSeekers.length === 0) {
    throw new AppError(
      "Job seeker profile not found",
      404
    );
  }

  const jobSeekerId = jobSeekers[0].id;

  const [result] = await pool.execute(
    `INSERT INTO job_seeker_education (
       job_seeker_id,
       education_level,
       course,
       specialization,
       course_type,
       start_year,
       end_year,
       grading_system,
       grade_value
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jobSeekerId,
      educationLevel,
      course,
      specialization,
      courseType,
      startYear,
      endYear,
      gradingSystem,
      gradeValue,
    ]
  );

  const [education] = await pool.execute(
    `SELECT
       id,
       education_level,
       course,
       specialization,
       course_type,
       start_year,
       end_year,
       grading_system,
       grade_value,
       created_at,
       updated_at
     FROM job_seeker_education
     WHERE id = ?`,
    [result.insertId]
  );

  return education[0];
};

export const updateJobSeekerEducation = async (
  userId,
  educationId,
  data
) => {
  const {
    educationLevel,
    course,
    specialization,
    courseType,
    startYear,
    endYear,
    gradingSystem,
    gradeValue,
  } = data;

  const [records] = await pool.execute(
    `SELECT e.id
     FROM job_seeker_education e
     INNER JOIN job_seekers js
       ON js.id = e.job_seeker_id
     WHERE e.id = ?
     AND js.user_id = ?`,
    [educationId, userId]
  );

  if (records.length === 0) {
    throw new AppError(
      "Education record not found",
      404
    );
  }

  await pool.execute(
    `UPDATE job_seeker_education
     SET
       education_level = ?,
       course = ?,
       specialization = ?,
       course_type = ?,
       start_year = ?,
       end_year = ?,
       grading_system = ?,
       grade_value = ?
     WHERE id = ?`,
    [
      educationLevel,
      course,
      specialization,
      courseType,
      startYear,
      endYear,
      gradingSystem,
      gradeValue,
      educationId,
    ]
  );

  const [education] = await pool.execute(
    `SELECT
       id,
       education_level,
       course,
       specialization,
       course_type,
       start_year,
       end_year,
       grading_system,
       grade_value,
       created_at,
       updated_at
     FROM job_seeker_education
     WHERE id = ?`,
    [educationId]
  );

  return education[0];
};

export const deleteJobSeekerEducation = async (
  userId,
  educationId
) => {
  const [result] = await pool.execute(
    `DELETE e
     FROM job_seeker_education e
     INNER JOIN job_seekers js
       ON js.id = e.job_seeker_id
     WHERE e.id = ?
     AND js.user_id = ?`,
    [educationId, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError(
      "Education record not found",
      404
    );
  }
};