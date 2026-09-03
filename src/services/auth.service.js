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

  

  if (users.length === 0) {
    throw new AppError("Invalid email or password",401);
    
  }

  const userFromDb = users[0];

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

export const createRecruiter = async ({
  name,
  email,
  password,
  phone,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if email already exists
    const [existingUsers] = await connection.execute(
      `SELECT id
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (existingUsers.length > 0) {
      throw new AppError(
        "Email is already registered!",
        409
      );
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Create user
    const [userResult] = await connection.execute(
      `INSERT INTO users
        (
          name,
          email,
          password_hash,
          role,
          phone,
          password_changed_at
        )
       VALUES (?, ?, ?, 'RECRUITER', ?, CURRENT_TIMESTAMP)`,
      [
        name,
        email,
        passwordHash,
        phone || null,
      ]
    );

    const userId = userResult.insertId;

    // 4. Create recruiter profile
    const [recruiterResult] = await connection.execute(
      `INSERT INTO recruiters
        (
          user_id,
          company_id,
          status
        )
       VALUES (?, NULL, 'PENDING')`,
      [userId]
    );

    // 5. Commit transaction
    await connection.commit();

    // 6. Prepare response objects
    const user = {
      id: userId,
      name,
      email,
      role: "RECRUITER",
      phone: phone || null,
    };

    const recruiter = {
      id: recruiterResult.insertId,
      user_id: userId,
      company_id: null,
      status: "PENDING",
    };

    const token = generateToken(user);

    return {
      user,
      recruiter,
      token,
    };
  } catch (error) {
    // Rollback only if the transaction is still active
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback failed:",
        rollbackError.message
      );
    }

    throw error;
  } finally {
    connection.release();
  }
};