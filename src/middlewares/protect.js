import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/db.js";

const protect = asyncHandler(async (req, res, next) => {
  // 1. Check Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Authentication required", 401);
  }

  // 2. Extract Bearer token
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Invalid authorization header", 401);
  }

  // 3 & 4. Verify JWT signature and expiration
  let decoded;

  //Using try catch even though we have asyncHandler beacuse this we're using sync version of verify
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }

  // If a user is logged out, we can check if the token's jti is in a revoked tokens list in the database. If it is, we can reject the request.

  if (!decoded.jti) {
    throw new AppError("Invalid token", 401);
  }

  const [revokedTokens] = await pool.execute(
    `SELECT id
   FROM revoked_tokens
   WHERE jti = ?
     AND expires_at > NOW()`,
    [decoded.jti],
  );

  if (revokedTokens.length > 0) {
    throw new AppError("Token has been revoked. Please login again.", 401);
  }

  // 5. Check if user still exists in database
  const [users] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      role,
      phone,
      profile_image,
      password_changed_at
     FROM users
     WHERE id = ?`,
    [decoded.id],
  );

  if (users.length === 0) {
    throw new AppError("User no longer exists", 401);
  }

  const user = users[0];

  // 6. Check if password was changed after token was issued
  if (
    user.password_changed_at &&
    decoded.iat * 1000 < new Date(user.password_changed_at).getTime()
  ) {
    throw new AppError("Password was changed. Please login again.", 401);
  }

  // 7. Attach current user to request
  req.user = user;
  req.token=decoded; // Attach the decoded token to the request for use in logout

  // 8. Continue to the next middleware/controller
  next();
});

export default protect;
