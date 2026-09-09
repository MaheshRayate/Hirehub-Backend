import express from "express";
import { login, signup,recruiterSignup,logout } from "../controllers/authController.js";
import protect from "../middlewares/protect.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login",login);
router.post("/logout",protect,logout);
router.post("/recruiter-signup", recruiterSignup);

export default router;
