import asyncHandler from "../utils/asyncHandler.js";
import { getAllCompanies } from "../services/company.service.js";

export const getCompanies = asyncHandler(async (req, res) => {
  const companies = await getAllCompanies();

  return res.status(200).json({
    success: true,
    data: {
      companies,
    },
  });
});