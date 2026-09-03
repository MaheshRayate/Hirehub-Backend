import AppError from "../utils/AppError.js";

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError("Authentication required", 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You are not authorized to perform this action",
          403
        )
      );
    }

    next();
  };
};

export default restrictTo;