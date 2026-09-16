import {
  createUser,
  loginUser,
  createRecruiter,
  logoutUser,
} from "../services/auth.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

// JOBSEEKERS SIGNUP
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Provide Name, Email and Password", 400);
  }

  const allowedRoles = ["JOB_SEEKER", "RECRUITER"];

  const userRole = role || "JOB_SEEKER";

  if (!allowedRoles.includes(userRole)) {
    throw new AppError("Invalid Role", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await createUser({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: userRole,
    phone: phone?.trim(),
  });

  console.log(result.token,result.user);

  return res.status(201).json({
    success: true,
    message: "User account created successfully",
    data: {
      token: result.token,
      user: result.user,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Provide Email and Password", 400);
  }

  const result = await loginUser({
    email: email.trim().toLowerCase(),
    password,
  });

  console.log(result.token,result.user);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token: result.token,
      user: result.user,
    },
  });
});

//RECRUITERS SIGNUP

export const recruiterSignup = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Provide Name, Email and Password", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await createRecruiter({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone?.trim(),
    company_id:req.body.company_id
  });

  console.log(result.recruiter);

  return res.status(201).json({
    success: true,
    message:
      "Recruiter account created successfully. Waiting for admin approval.",
    data: {
      token: result.token,
      user: result.user,
      recruiter: result.recruiter,
    },
  });
});

//LOGOUT

export const logout = asyncHandler(async (req, res) => {
  const { jti, exp } = req.token;

  await logoutUser({
    jti,
    expiresAt: new Date(exp * 1000),
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});


