const ApiError = require('../utils/apiError');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode ||
      (error.name === 'ValidationError' ? 400 : 500);

    let message = error.message || 'Internal Server Error';
    let errors = [];

    // Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      message = `Duplicate value for '${field}'. Please provide another value.`;
      errors = [{ field, message }];
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      message = 'Mongoose validation failed';
      errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message
      }));
    }

    // Mongoose cast error (e.g. invalid ObjectId)
    if (error.name === 'CastError') {
      message = `Invalid format for resource identifier '${error.path}'`;
      errors = [{ field: error.path, message: `Invalid ObjectId: ${error.value}` }];
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  if (error.statusCode === 500) {
    console.error('Internal Server Error:', err);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || []
  };

  if (config.env === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
