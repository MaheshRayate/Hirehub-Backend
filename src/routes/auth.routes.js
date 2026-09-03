import express from "express";
import { login, signup,recruiterSignup } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login",login);
router.post("/recruiter-signup", recruiterSignup);

export default router;
