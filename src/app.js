import express from "express";
import authRouter from "./routes/auth.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import jobRouter from "./routes/job.routes.js";
import adminRouter from "./routes/admin.routes.js";
import companyRouter from "./routes/company.routes.js";

const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Job Portal API is running",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs",jobRouter);
app.use("/api/v1/admin",adminRouter);
app.use("/api/v1/companies",companyRouter);
// Global error handler
app.use(errorHandler);

export default app;
