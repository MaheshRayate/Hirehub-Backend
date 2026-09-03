import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

export const approveRecruiter = async ({recruiterId, companyId}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    //1) Check if recruiter exists

    const [recruiters] = await connection.execute(
      `SELECT id,user_id,company_id,status from recruiters where id=?`,
      [recruiterId],
    );

    if (recruiters.length === 0) {
      throw new AppError("Recruiter not found", 404);
    }

    const recruiter = recruiters[0];

    // 2)Recruiters status must be pending

    if (recruiter.status !== "PENDING") {
      throw new AppError(
        `Recruiter is already ${recruiter.status.toLowerCase()}`,
        400,
      );
    }

    //3) Check if company exists
    const [companies] = await connection.execute(
      `SELECT id from companies where id=?`,
      [companyId],
    );

    if (companies.length === 0) {
      throw new AppError("Company not found", 404);
    }

    //4)Assign company and approve recruiter
    await connection.execute(
      `UPDATE recruiters SET company_id=?, status='APPROVED' WHERE id=?`,
      [companyId, recruiterId],
    );

    //5)Commit transaction
    await connection.commit();

    return {
      id: recruiter.id,
      user_id: recruiter.user_id,
      company_id: companyId,
      status: "APPROVED",
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError.message);
    }

    throw error;
  } finally {
    connection.release();
  }
};
