import express from "express";

import protect from "../middlewares/protect.js";
import restrictTo from "../middlewares/restrictTo.js";

import {
  approveRecruiter,
} from "../controllers/adminController.js";

const router = express.Router();

router.patch(
  "/recruiters/:recruiterId/approve",
  protect,
  restrictTo("ADMIN"),
  approveRecruiter
);

export default router;