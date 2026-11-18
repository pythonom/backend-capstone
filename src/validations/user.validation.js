const Joi = require('joi');
const { ROLES } = require('../utils/constants');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
    studentId: Joi.string().trim().optional(),
    facultyId: Joi.string().trim().optional(),
    academicGroup: objectId.optional()
  })
};

const updateUser = {
  params: Joi.object().keys({
    userId: objectId.required()
  }),
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(50).optional(),
    email: Joi.string().trim().email().optional(),
    role: Joi.string().valid(...Object.values(ROLES)).optional(),
    studentId: Joi.string().trim().optional(),
    facultyId: Joi.string().trim().optional(),
    academicGroup: objectId.allow(null).optional(),
    isActive: Joi.boolean().optional()
  }).min(1)
};

const getUserById = {
  params: Joi.object().keys({
    userId: objectId.required()
  })
};

const listUsers = {
  query: Joi.object().keys({
    role: Joi.string().valid(...Object.values(ROLES)).optional(),
    academicGroup: objectId.optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

module.exports = {
  createUser,
  updateUser,
  getUserById,
  listUsers
};
