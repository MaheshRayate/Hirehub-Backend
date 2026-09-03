import { approveRecruiter as approveRecruiterService } from "../services/admin.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";


export const approveRecruiter=asyncHandler(async(req,res)=>{

    const {recruiterId}=req.params;
    const {companyId}=req.body;

    // Validate recruiterId
    if (
      !Number.isInteger(Number(recruiterId)) ||
      Number(recruiterId) <= 0
    ) {
      throw new AppError(
        "Invalid recruiter ID",
        400
      );
    }

    // Validate companyId
    if (
      !Number.isInteger(Number(companyId)) ||
      Number(companyId) <= 0
    ) {
      throw new AppError(
        "Invalid company ID",
        400
      );
    }

    const recruiter =
      await approveRecruiterService({
        recruiterId: Number(recruiterId),
        companyId: Number(companyId),
      });

    return res.status(200).json({
      success: true,
      message:
        "Recruiter approved and company assigned successfully",
      data: {
        recruiter,
      },
    });

});
