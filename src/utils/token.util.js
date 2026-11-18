const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');

const generateAccessToken = (payload) => {
  return jwt.sign(
    { ...payload, nonce: crypto.randomBytes(8).toString('hex') },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn
    }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, nonce: crypto.randomBytes(16).toString('hex') },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
