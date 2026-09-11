import { createJob as createJobService, getAllJobs } from "../services/job.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    companyId = req.recruiter.company_id,
    location,
    employmentType,
    experienceMin,
    experienceMax,
    salaryMin,
    salaryMax,
    vacancies,
    skills,
  } = req.body;

  // 1. Required fields
  if (!title || !description || !employmentType) {
    throw new AppError(
      "Title, description and employmentType are required",
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

  // 6. Validate vacancies
  if (
    vacancies !== undefined &&
    (!Number.isInteger(Number(vacancies)) || Number(vacancies) <= 0)
  ) {
    throw new AppError("Vacancies must be a positive integer", 400);
  }

  // 7. Create job
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

    vacancies:
      vacancies !== undefined
        ? Number(vacancies)
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

export const getJobs = asyncHandler(async (req, res) => {
  const {
    search,
    location,
    experience_min,
    experience_max,
    salary_min,
    salary_max,
    freshness,
    vacancies,
    sort,
    work_mode,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1
  ) {
    throw new AppError("Invalid page", 400);
  }

  if (
    !Number.isInteger(limitNumber) ||
    limitNumber < 1 ||
    limitNumber > 100
  ) {
    throw new AppError(
      "Limit must be between 1 and 100",
      400
    );
  }

  // console.log(req.query);

  const locations = location
    ? location
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const experienceMin =
    experience_min !== undefined
      ? Number(experience_min)
      : undefined;

  const experienceMax =
    experience_max !== undefined
      ? Number(experience_max)
      : undefined;

  const salaryMin =
    salary_min !== undefined
      ? Number(salary_min)
      : undefined;

  const salaryMax =
    salary_max !== undefined
      ? Number(salary_max)
      : undefined;

  const freshnessDays =
    freshness !== undefined
      ? Number(freshness)
      : undefined;

  // Validate numeric filters
  if (
    experienceMin !== undefined &&
    (!Number.isInteger(experienceMin) || experienceMin < 0)
  ) {
    throw new AppError("Invalid experience_min", 400);
  }

  if (
    experienceMax !== undefined &&
    (!Number.isInteger(experienceMax) || experienceMax < 0)
  ) {
    throw new AppError("Invalid experience_max", 400);
  }

  if (
    salaryMin !== undefined &&
    (!Number.isFinite(salaryMin) || salaryMin < 0)
  ) {
    throw new AppError("Invalid salary_min", 400);
  }

  if (
    salaryMax !== undefined &&
    (!Number.isFinite(salaryMax) || salaryMax < 0)
  ) {
    throw new AppError("Invalid salary_max", 400);
  }

  if (
    freshnessDays !== undefined &&
    (!Number.isInteger(freshnessDays) || freshnessDays <= 0)
  ) {
    throw new AppError("Invalid freshness", 400);
  }

  if (
    experienceMin !== undefined &&
    experienceMax !== undefined &&
    experienceMin > experienceMax
  ) {
    throw new AppError(
      "experience_min cannot be greater than experience_max",
      400
    );
  }

  if (
    salaryMin !== undefined &&
    salaryMax !== undefined &&
    salaryMin > salaryMax
  ) {
    throw new AppError(
      "salary_min cannot be greater than salary_max",
      400
    );
  }

  if (
    vacancies !== undefined &&
    (!Number.isInteger(Number(vacancies)) || Number(vacancies) <= 0)
  ) {
    throw new AppError("Vacancies must be a positive integer", 400);
  }

  const allowedWorkModes = [
    "ONSITE",
    "REMOTE",
    "HYBRID",
  ];

  if (
    work_mode &&
    !allowedWorkModes.includes(work_mode)
  ) {
    throw new AppError("Invalid work mode", 400);
  }

  const allowedSorts = [
    "newest",
    "oldest",
    "salary_high",
    "salary_low",
  ];

  const selectedSort = sort || "newest";

  if (!allowedSorts.includes(selectedSort)) {
    throw new AppError("Invalid sort option", 400);
  }

  const result = await getAllJobs({
    search: search?.trim(),
    locations,
    experienceMin,
    experienceMax,
    salaryMin,
    salaryMax,
    freshness: freshnessDays,
    sort: selectedSort,
    workMode: work_mode,
    page: pageNumber,
    limit: limitNumber,
  });

  return res.status(200).json({
    success: true,
    count:result.jobs.length,
    data: {
      jobs: result.jobs,
      pagination: result.pagination,
    },
  });
});