// Confirms whether the recruiter has been approved by the admin and has a company assigned. If not, it throws an error.

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";

const checkRecruiterApproved=asyncHandler(async (req, res, next) => {

  // Find recruiter's current status and company
  const [recruiters] = await pool.execute(
    `SELECT
      id,
      company_id,
      status
     FROM recruiters
     WHERE user_id = ?`,
    [req.user.id]
  );

  if (recruiters.length === 0) {
    throw new AppError(
      "Recruiter profile not found",
      404
    );
  }

  const recruiter = recruiters[0];

  // Recruiter must be approved
  if (recruiter.status !== "APPROVED") {
    throw new AppError(
      "Your recruiter account has not been approved",
      403
    );
  }

  // Recruiter must have a company
  if (!recruiter.company_id) {
    throw new AppError(
      "No company is assigned to your recruiter account",
      403
    );
  }

  // Attach recruiter information to request
  req.recruiter = recruiter;

  next();
});

export default checkRecruiterApproved;