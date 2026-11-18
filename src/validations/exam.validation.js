const Joi = require('joi');
const { EXAM_STATUS } = require('../utils/constants');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const createExam = {
  body: Joi.object().keys({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().allow('').optional(),
    instructions: Joi.string().trim().allow('').optional(),
    course: Joi.string().trim().required(),
    assignedGroups: Joi.array().items(objectId).default([]),
    assignedStudents: Joi.array().items(objectId).default([]),
    questions: Joi.array()
      .items(
        Joi.object().keys({
          questionId: objectId.required(),
          marks: Joi.number().min(0.5).optional(),
          negativeMarks: Joi.number().min(0).optional()
        })
      )
      .min(1)
      .required(),
    totalMarks: Joi.number().optional(),
    passingMarks: Joi.number().min(0).optional(),
    durationMinutes: Joi.number().integer().min(1).max(720).required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
    settings: Joi.object().keys({
      randomizeQuestions: Joi.boolean().default(true),
      randomizeOptions: Joi.boolean().default(true),
      negativeMarking: Joi.boolean().default(false),
      defaultNegativeMarksPerQuestion: Joi.number().min(0).default(0),
      allowRetake: Joi.boolean().default(false),
      maxRetakes: Joi.number().integer().min(0).default(0),
      isResultReleased: Joi.boolean().default(false),
      showQuestionReviewToStudent: Joi.boolean().default(false)
    }).optional()
  })
};

const updateExam = {
  params: Joi.object().keys({
    examId: objectId.required()
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().allow('').optional(),
    instructions: Joi.string().trim().allow('').optional(),
    course: Joi.string().trim().optional(),
    assignedGroups: Joi.array().items(objectId).optional(),
    assignedStudents: Joi.array().items(objectId).optional(),
    questions: Joi.array()
      .items(
        Joi.object().keys({
          questionId: objectId.required(),
          marks: Joi.number().min(0.5).optional(),
          negativeMarks: Joi.number().min(0).optional()
        })
      )
      .min(1)
      .optional(),
    passingMarks: Joi.number().min(0).optional(),
    durationMinutes: Joi.number().integer().min(1).max(720).optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
    status: Joi.string().valid(...Object.values(EXAM_STATUS)).optional(),
    settings: Joi.object().keys({
      randomizeQuestions: Joi.boolean().optional(),
      randomizeOptions: Joi.boolean().optional(),
      negativeMarking: Joi.boolean().optional(),
      defaultNegativeMarksPerQuestion: Joi.number().min(0).optional(),
      allowRetake: Joi.boolean().optional(),
      maxRetakes: Joi.number().integer().min(0).optional(),
      isResultReleased: Joi.boolean().optional(),
      showQuestionReviewToStudent: Joi.boolean().optional()
    }).optional()
  }).min(1)
};

const getExamById = {
  params: Joi.object().keys({
    examId: objectId.required()
  })
};

const listExams = {
  query: Joi.object().keys({
    status: Joi.string().valid(...Object.values(EXAM_STATUS)).optional(),
    course: Joi.string().trim().optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

module.exports = {
  createExam,
  updateExam,
  getExamById,
  listExams
};
