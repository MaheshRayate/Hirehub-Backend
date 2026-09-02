const errorHandler = async (err, req, res, next) => {
  console.log(err);

  return res.status(err.statusCode || 500).json({
    sucess: false,
    message: err.message || "Something Went Wrong",
  });
};

export default errorHandler;
