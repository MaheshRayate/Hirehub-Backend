import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

import {
  getJobSeekerProfile,
  updateJobSeekerProfile,
  getJobSeekerPreferences,
  updateJobSeekerPreferences,
  getJobSeekerSkills,
  updateJobSeekerSkills,
  getAllSkills, //Master list of all skills and dont belong to the user
  getJobSeekerEmployment,
  addJobSeekerEmployment,
  updateJobSeekerEmployment,
  deleteJobSeekerEmployment,
  getJobSeekerProjects,
  addJobSeekerProject,
  updateJobSeekerProject,
  deleteJobSeekerProject,
  getJobSeekerEducation,
  addJobSeekerEducation,
  updateJobSeekerEducation,
  deleteJobSeekerEducation,
} from "../services/jobseekers.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can access this profile", 403);
  }

  const profile = await getJobSeekerProfile(req.user.id);

  return res.status(200).json({
    success: true,
    data: {
      profile,
    },
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can update this profile", 403);
  }

  const profile = await updateJobSeekerProfile(req.user.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      profile,
    },
  });
});

export const getMyPreferences = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can access preferences", 403);
  }

  const preferences = await getJobSeekerPreferences(req.user.id);

  return res.status(200).json({
    success: true,
    data: {
      preferences,
    },
  });
});

export const updateMyPreferences = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can update preferences", 403);
  }

  const preferences = await updateJobSeekerPreferences(req.user.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: {
      preferences,
    },
  });
});

export const getMySkills = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can access skills", 403);
  }

  const skills = await getJobSeekerSkills(req.user.id);

  return res.status(200).json({
    success: true,
    data: {
      skills,
    },
  });
});

export const updateMySkills = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can update skills", 403);
  }

  const { skillIds } = req.body;

  if (!Array.isArray(skillIds)) {
    throw new AppError("skillIds must be an array", 400);
  }

  const cleanedSkillIds = skillIds.filter((id) => Number.isInteger(id));

  if (cleanedSkillIds.length !== skillIds.length) {
    throw new AppError("All skill IDs must be integers", 400);
  }

  const uniqueSkillIds = [...new Set(cleanedSkillIds)];

  const skills = await updateJobSeekerSkills(req.user.id, uniqueSkillIds);

  return res.status(200).json({
    success: true,
    message: "Skills updated successfully",
    data: {
      skills,
    },
  });
});

//Master list of all skills and dont belong to the user will allow user to select a skills from dropdown
export const getSkills = asyncHandler(async (req, res) => {
  const skills = await getAllSkills();

  return res.status(200).json({
    success: true,
    data: {
      skills,
    },
  });
});

export const getMyEmployment = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can access employment", 403);
  }

  const employment = await getJobSeekerEmployment(req.user.id);

  return res.status(200).json({
    success: true,
    data: {
      employment,
    },
  });
});

export const addMyEmployment = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can add employment", 403);
  }

  const employment = await addJobSeekerEmployment(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: "Employment added successfully",
    data: {
      employment,
    },
  });
});

export const updateMyEmployment = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can update employment", 403);
  }

  const employmentId = Number(req.params.employmentId);

  if (!Number.isInteger(employmentId)) {
    throw new AppError("Invalid employment ID", 400);
  }

  const employment = await updateJobSeekerEmployment(
    req.user.id,
    employmentId,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Employment updated successfully",
    data: {
      employment,
    },
  });
});

export const deleteMyEmployment = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can delete employment", 403);
  }

  const employmentId = Number(req.params.employmentId);

  if (!Number.isInteger(employmentId)) {
    throw new AppError("Invalid employment ID", 400);
  }

  await deleteJobSeekerEmployment(req.user.id, employmentId);

  return res.status(200).json({
    success: true,
    message: "Employment deleted successfully",
  });
});

export const getMyProjects = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can access projects", 403);
  }

  const projects = await getJobSeekerProjects(req.user.id);

  return res.status(200).json({
    success: true,
    data: {
      projects,
    },
  });
});

export const addMyProject = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can add projects", 403);
  }

  const { title, description } = req.body;

  if (!title || !description) {
    throw new AppError("Title and description are required", 400);
  }

  const project = await addJobSeekerProject(req.user.id, {
    title: title.trim(),
    description: description.trim(),
  });

  return res.status(201).json({
    success: true,
    message: "Project added successfully",
    data: {
      project,
    },
  });
});

export const updateMyProject = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can update projects", 403);
  }

  const projectId = Number(req.params.projectId);

  if (!Number.isInteger(projectId)) {
    throw new AppError("Invalid project ID", 400);
  }

  const { title, description } = req.body;

  if (!title || !description) {
    throw new AppError("Title and description are required", 400);
  }

  const project = await updateJobSeekerProject(req.user.id, projectId, {
    title: title.trim(),
    description: description.trim(),
  });

  return res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: {
      project,
    },
  });
});

export const deleteMyProject = asyncHandler(async (req, res) => {
  if (req.user.role !== "JOB_SEEKER") {
    throw new AppError("Only job seekers can delete projects", 403);
  }

  const projectId = Number(req.params.projectId);

  if (!Number.isInteger(projectId)) {
    throw new AppError("Invalid project ID", 400);
  }

  await deleteJobSeekerProject(req.user.id, projectId);

  return res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});

// Get my education
export const getMyEducation = asyncHandler(
  async (req, res) => {
    if (req.user.role !== "JOB_SEEKER") {
      throw new AppError(
        "Only job seekers can access education",
        403
      );
    }

    const education = await getJobSeekerEducation(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: {
        education,
      },
    });
  }
);


// Add education
export const addMyEducation = asyncHandler(
  async (req, res) => {
    if (req.user.role !== "JOB_SEEKER") {
      throw new AppError(
        "Only job seekers can add education",
        403
      );
    }

    const {
      educationLevel,
      course,
      specialization,
      courseType,
      startYear,
      endYear,
      gradingSystem,
      gradeValue,
    } = req.body;

    // Required field
    if (!educationLevel) {
      throw new AppError(
        "Education level is required",
        400
      );
    }

    const education = await addJobSeekerEducation(
      req.user.id,
      {
        educationLevel,
        course,
        specialization,
        courseType,
        startYear,
        endYear,
        gradingSystem,
        gradeValue,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Education added successfully",
      data: {
        education,
      },
    });
  }
);


// Update education
export const updateMyEducation = asyncHandler(
  async (req, res) => {
    if (req.user.role !== "JOB_SEEKER") {
      throw new AppError(
        "Only job seekers can update education",
        403
      );
    }

    const educationId = Number(
      req.params.educationId
    );

    if (!Number.isInteger(educationId)) {
      throw new AppError(
        "Invalid education ID",
        400
      );
    }

    const {
      educationLevel,
      course,
      specialization,
      courseType,
      startYear,
      endYear,
      gradingSystem,
      gradeValue,
    } = req.body;

    // Required field
    if (!educationLevel) {
      throw new AppError(
        "Education level is required",
        400
      );
    }

    const education =
      await updateJobSeekerEducation(
        req.user.id,
        educationId,
        {
          educationLevel,
          course,
          specialization,
          courseType,
          startYear,
          endYear,
          gradingSystem,
          gradeValue,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Education updated successfully",
      data: {
        education,
      },
    });
  }
);


// Delete education
export const deleteMyEducation = asyncHandler(
  async (req, res) => {
    if (req.user.role !== "JOB_SEEKER") {
      throw new AppError(
        "Only job seekers can delete education",
        403
      );
    }

    const educationId = Number(
      req.params.educationId
    );

    if (!Number.isInteger(educationId)) {
      throw new AppError(
        "Invalid education ID",
        400
      );
    }

    await deleteJobSeekerEducation(
      req.user.id,
      educationId
    );

    return res.status(200).json({
      success: true,
      message: "Education deleted successfully",
    });
  }
);
