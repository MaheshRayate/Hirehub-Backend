import express from "express";

import protect from "../middlewares/protect.js";

import {
  getMyProfile,
  getMyPreferences,
  updateMyPreferences,
  updateMyProfile,
  getMySkills,
  updateMySkills,
  getSkills,
  getMyEmployment,
  updateMyEmployment,
  addMyEmployment,
  deleteMyEmployment,
  getMyProjects,
  addMyProject,
  updateMyProject,
  deleteMyProject,
  getMyEducation,
  addMyEducation,
  updateMyEducation,
  deleteMyEducation,
} from "../controllers/jobSeekerController.js";

const router = express.Router();

router.route("/me").get(protect, getMyProfile).patch(protect, updateMyProfile);

router
  .route("/me/preferences")
  .get(protect, getMyPreferences)
  .put(protect, updateMyPreferences);

router
  .route("/me/skills")
  .get(protect, getMySkills)
  .put(protect, updateMySkills);

router
  .route("/me/employment")
  .get(protect, getMyEmployment)
  .post(protect, addMyEmployment);

router
  .route("/me/employment/:employmentId")
  .patch(protect, updateMyEmployment)
  .delete(protect, deleteMyEmployment);

router
  .route("/me/projects")
  .get(protect, getMyProjects)
  .post(protect, addMyProject);

router
  .route("/me/project/:projectId")
  .patch(protect, updateMyProject)
  .delete(protect, deleteMyProject);

router
  .route("/me/education")
  .get(protect, getMyEducation)
  .post(protect, addMyEducation);

router
  .route("/me/education/:educationId")
  .patch(protect, updateMyEducation)
  .delete(protect, deleteMyEducation);

//Master list of all skills and dont belong to the user
router.get("/skills", getSkills);

export default router;
