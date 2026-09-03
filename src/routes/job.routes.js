import express from "express";
import protect from "../middlewares/protect.js";
import { createJob } from "../controllers/jobController.js";

const router=express.Router();


router.route("/").post(protect,createJob);

export default router;