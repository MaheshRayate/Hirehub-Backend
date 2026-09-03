import { createJob as createJobService } from "../services/job.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createJob = asyncHandler(async (req, res) => {
  const {
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
  } = req.body;

  // 1. Required fields
  if (!title || !description || !companyId || !employmentType) {
    throw new AppError(
      "Title, description, companyId and employmentType are required",
      400
    );
  }

  // 2. Validate employment type
  const allowedEmploymentTypes = [
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
  ];

  if (!allowedEmploymentTypes.includes(employmentType)) {
    throw new AppError("Invalid employment type", 400);
  }

  // 3. Validate companyId
  if (!Number.isInteger(Number(companyId)) || Number(companyId) <= 0) {
    throw new AppError("Invalid companyId", 400);
  }

  // 4. Validate experience
  if (
    experienceMin !== undefined &&
    (!Number.isInteger(Number(experienceMin)) ||
      Number(experienceMin) < 0)
  ) {
    throw new AppError("Invalid minimum experience", 400);
  }

  if (
    experienceMax !== undefined &&
    (!Number.isInteger(Number(experienceMax)) ||
      Number(experienceMax) < 0)
  ) {
    throw new AppError("Invalid maximum experience", 400);
  }

  if (
    experienceMin !== undefined &&
    experienceMax !== undefined &&
    Number(experienceMax) < Number(experienceMin)
  ) {
    throw new AppError(
      "Maximum experience cannot be less than minimum experience",
      400
    );
  }

  // 5. Validate salary
  if (
    salaryMin !== undefined &&
    (!Number.isFinite(Number(salaryMin)) || Number(salaryMin) < 0)
  ) {
    throw new AppError("Invalid minimum salary", 400);
  }

  if (
    salaryMax !== undefined &&
    (!Number.isFinite(Number(salaryMax)) || Number(salaryMax) < 0)
  ) {
    throw new AppError("Invalid maximum salary", 400);
  }

  if (
    salaryMin !== undefined &&
    salaryMax !== undefined &&
    Number(salaryMax) < Number(salaryMin)
  ) {
    throw new AppError(
      "Maximum salary cannot be less than minimum salary",
      400
    );
  }

  // 6. Create job
  const job = await createJobService({
    userId: req.user.id,
    title: title.trim(),
    description: description.trim(),
    companyId: Number(companyId),
    location: location?.trim(),
    employmentType,
    experienceMin:
      experienceMin !== undefined
        ? Number(experienceMin)
        : undefined,
    experienceMax:
      experienceMax !== undefined
        ? Number(experienceMax)
        : undefined,
    salaryMin:
      salaryMin !== undefined
        ? Number(salaryMin)
        : undefined,
    salaryMax:
      salaryMax !== undefined
        ? Number(salaryMax)
        : undefined,
    skills: skills?.trim(),
  });

  return res.status(201).json({
    success: true,
    message: "Job created successfully",
    data: {
      job,
    },
  });
});