import express from "express";
import protect from "../middlewares/protect.js";
import { createJob, getJobs } from "../controllers/jobController.js";
import checkRecruiterApproved from "../middlewares/recruiterProtect.js";
import restrictTo from "../middlewares/restrictTo.js";

const router = express.Router();

router
  .route("/")
  .get(getJobs)
  .post(protect, restrictTo("RECRUITER"), checkRecruiterApproved, createJob);

export default router;
