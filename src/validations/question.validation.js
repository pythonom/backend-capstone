const Joi = require('joi');
const { QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../utils/constants');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const createQuestion = {
  body: Joi.object().keys({
    title: Joi.string().trim().required(),
    type: Joi.string().valid(...Object.values(QUESTION_TYPES)).default(QUESTION_TYPES.MCQ),
    subject: Joi.string().trim().required(),
    topic: Joi.string().trim().required(),
    difficulty: Joi.string().valid(...Object.values(DIFFICULTY_LEVELS)).default(DIFFICULTY_LEVELS.MEDIUM),
    marks: Joi.number().min(0.5).max(100).required(),
    negativeMarks: Joi.number().min(0).max(50).default(0),
    options: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required(),
          text: Joi.string().trim().required()
        })
      )
      .when('type', {
        is: QUESTION_TYPES.MCQ,
        then: Joi.array().min(2).required(),
        otherwise: Joi.array().optional()
      }),
    correctAnswer: Joi.string().trim().required(),
    explanation: Joi.string().trim().allow('').optional()
  })
};

const updateQuestion = {
  params: Joi.object().keys({
    questionId: objectId.required()
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().optional(),
    type: Joi.string().valid(...Object.values(QUESTION_TYPES)).optional(),
    subject: Joi.string().trim().optional(),
    topic: Joi.string().trim().optional(),
    difficulty: Joi.string().valid(...Object.values(DIFFICULTY_LEVELS)).optional(),
    marks: Joi.number().min(0.5).max(100).optional(),
    negativeMarks: Joi.number().min(0).max(50).optional(),
    options: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().required(),
        text: Joi.string().trim().required()
      })
    ).optional(),
    correctAnswer: Joi.string().trim().optional(),
    explanation: Joi.string().trim().allow('').optional()
  }).min(1)
};

const listQuestions = {
  query: Joi.object().keys({
    subject: Joi.string().trim().optional(),
    topic: Joi.string().trim().optional(),
    difficulty: Joi.string().valid(...Object.values(DIFFICULTY_LEVELS)).optional(),
    type: Joi.string().valid(...Object.values(QUESTION_TYPES)).optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

const getQuestionById = {
  params: Joi.object().keys({
    questionId: objectId.required()
  })
};

module.exports = {
  createQuestion,
  updateQuestion,
  listQuestions,
  getQuestionById
};
