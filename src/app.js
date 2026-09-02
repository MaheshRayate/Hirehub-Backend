import express from "express";
import authRouter from "./routes/auth.routes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Job Portal API is running",
  });
});

app.use("/api/v1/auth", authRouter);

// Global error handler
app.use(errorHandler);

export default app;
