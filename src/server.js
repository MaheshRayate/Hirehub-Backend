import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT;
const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully!");

    connection.release();

    app.listen(PORT || 3000, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Database connection failed", error.message);
    process.exit(1);
  }
};

startServer();
