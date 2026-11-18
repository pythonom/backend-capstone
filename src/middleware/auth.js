const { verifyAccessToken } = require('../utils/token.util');
const ApiError = require('../utils/apiError');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError(401, 'Authentication token is required'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Authentication token has expired. Please refresh your token.'));
      }
      return next(new ApiError(401, 'Invalid authentication token'));
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(new ApiError(401, 'User associated with this token no longer exists'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated. Please contact administrator.'));
    }

    // Attach user without password
    const userJson = user.toJSON();
    req.user = userJson;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User must be authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
