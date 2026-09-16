import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

export const createUser = async ({
  name,
  email,
  password,
  role,
  phone,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await connection.execute(
      `INSERT INTO users
       (name, email, password_hash, role, phone, password_changed_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        name,
        email,
        passwordHash,
        role,
        phone || null,
      ]
    );

    const userId = result.insertId;

    // Create job seeker profile
    if (role === "JOB_SEEKER") {
      await connection.execute(
        `INSERT INTO job_seekers (user_id)
         VALUES (?)`,
        [userId]
      );
    }

    await connection.commit();

    const user = {
      id: userId,
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
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  company_id
}) => {
  const connection = await pool.getConnection();
  console.log(company_id);
  

  try {
    await connection.beginTransaction();

    // 1. Check if email already exists
    const [existingUsers] = await connection.execute(
      `SELECT id
       FROM users
       WHERE email = ?`,
      [email]
    );

    console.log(company_id);

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
       VALUES (?, ?, 'PENDING')`,
      [userId,company_id]
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

    console.log(company_id);

    const recruiter = {
      id: recruiterResult.insertId,
      user_id: userId,
      company_id: company_id,
      status: "PENDING",
    };

    const token = generateToken(user);

    console.log(recruiter);

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

export const logoutUser = async ({
  jti,
  expiresAt,
}) => {
  await pool.execute(
    `INSERT IGNORE INTO revoked_tokens
      (jti, expires_at)
     VALUES (?, ?)`,
    [jti, expiresAt]
  );
};