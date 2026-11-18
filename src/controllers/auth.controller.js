const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/token.util');
const { logAction } = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../utils/constants');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, facultyId, academicGroup } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId,
      facultyId,
      academicGroup
    });

    await logAction({
      action: AUDIT_ACTIONS.USER_CREATE,
      userId: user._id,
      userRole: user.role,
      details: { email: user.email, role: user.role },
      req
    });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshTokenStr = generateRefreshToken({ id: user._id, role: user.role });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenStr,
      expiresAt
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user,
          tokens: {
            accessToken,
            refreshToken: refreshTokenStr
          }
        },
        'User registered successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated. Please contact administrator.');
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshTokenStr = generateRefreshToken({ id: user._id, role: user.role });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenStr,
      expiresAt
    });

    await logAction({
      action: AUDIT_ACTIONS.AUTH_LOGIN,
      userId: user._id,
      userRole: user.role,
      details: { email: user.email },
      req
    });

    const userJson = user.toJSON();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: userJson,
          tokens: {
            accessToken,
            refreshToken: refreshTokenStr
          }
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: tokenStr } = req.body;

    const tokenDoc = await RefreshToken.findOne({ token: tokenStr });
    if (!tokenDoc) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(tokenStr);
    } catch (err) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      throw new ApiError(401, 'Refresh token has expired. Please login again.');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User no longer exists or is deactivated');
    }

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

    res.status(200).json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        'Access token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: tokenStr } = req.body;

    if (tokenStr) {
      await RefreshToken.deleteOne({ token: tokenStr });
    }

    await logAction({
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      userId: req.user._id,
      userRole: req.user.role,
      req
    });

    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('academicGroup');
    res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};
