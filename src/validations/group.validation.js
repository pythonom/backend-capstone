const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const createGroup = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().uppercase().required(),
    department: Joi.string().trim().required(),
    semester: Joi.number().integer().min(1).max(12).required(),
    academicYear: Joi.string().trim().required(),
    description: Joi.string().trim().allow('').optional()
  })
};

const updateGroup = {
  params: Joi.object().keys({
    groupId: objectId.required()
  }),
  body: Joi.object().keys({
    name: Joi.string().trim().optional(),
    code: Joi.string().trim().uppercase().optional(),
    department: Joi.string().trim().optional(),
    semester: Joi.number().integer().min(1).max(12).optional(),
    academicYear: Joi.string().trim().optional(),
    description: Joi.string().trim().allow('').optional()
  }).min(1)
};

const getGroupById = {
  params: Joi.object().keys({
    groupId: objectId.required()
  })
};

module.exports = {
  createGroup,
  updateGroup,
  getGroupById
};
