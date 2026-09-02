import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

export const createUser = async ({ name, email, password, role, phone }) => {
  const [existingUsers] = await pool.execute(
    `SELECT id from users WHERE email=?`,
    [email],
  );

  if (existingUsers.length > 0) {
    throw new AppError("Email is already registered!", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [result] = await pool.execute(
    `INSERT INTO users (name,email,password_hash,role,phone) values (?,?,?,?,?)`,
    [name, email, passwordHash, role, phone || null],
  );

  const user = {
    id: result.insertId,
    name,
    email,
    role,
    phone: phone || null,
  };

  const token = generateToken(user);

  return {
    user,
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const [users] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      password_hash,
      role,
      phone,
      profile_image
    FROM users
    WHERE email = ?`,
    [email],
  );

  const userFromDb = users[0];

  if (users.length === 0) {
    throw new AppError("Invalid email or password",401);
    
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    userFromDb.password_hash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const user = {
    id: userFromDb.id,
    name: userFromDb.name,
    email: userFromDb.email,
    role: userFromDb.role,
    phone: userFromDb.phone,
    profile_image: userFromDb.profile_image,
  };

  const token = generateToken(user);

  return {
    token,
    user,
  };
};
