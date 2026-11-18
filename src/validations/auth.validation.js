const Joi = require('joi');
const { ROLES } = require('../utils/constants');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const register = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.STUDENT),
    studentId: Joi.string().trim().optional(),
    facultyId: Joi.string().trim().optional(),
    academicGroup: objectId.optional()
  })
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  })
};

const refreshToken = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
};

module.exports = {
  register,
  login,
  refreshToken
};
