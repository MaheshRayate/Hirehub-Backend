import pool from "../config/db.js";

export const getAllCompanies = async () => {
  const [companies] = await pool.execute(
    `SELECT
      id,
      name,
      description,
      website,
      logo,
      location,
      status
     FROM companies
     WHERE status = 'APPROVED'
     ORDER BY name ASC`
  );

  return companies;
};