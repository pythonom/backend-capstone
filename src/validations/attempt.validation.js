const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const startExam = {
  params: Joi.object().keys({
    examId: objectId.required()
  })
};

const saveAnswer = {
  params: Joi.object().keys({
    attemptId: objectId.required()
  }),
  body: Joi.object().keys({
    questionId: objectId.required(),
    selectedOption: Joi.string().allow(null, '').optional(),
    descriptiveAnswer: Joi.string().allow('').optional()
  })
};

const submitExam = {
  params: Joi.object().keys({
    attemptId: objectId.required()
  }),
  body: Joi.object().keys({
    responses: Joi.array()
      .items(
        Joi.object().keys({
          questionId: objectId.required(),
          selectedOption: Joi.string().allow(null, '').optional(),
          descriptiveAnswer: Joi.string().allow('').optional()
        })
      )
      .optional()
  })
};

const evaluateDescriptive = {
  params: Joi.object().keys({
    attemptId: objectId.required()
  }),
  body: Joi.object().keys({
    evaluations: Joi.array()
      .items(
        Joi.object().keys({
          questionId: objectId.required(),
          marksAwarded: Joi.number().min(0).required(),
          feedback: Joi.string().trim().allow('').optional()
        })
      )
      .min(1)
      .required()
  })
};

const getAttemptById = {
  params: Joi.object().keys({
    attemptId: objectId.required()
  })
};

module.exports = {
  startExam,
  saveAnswer,
  submitExam,
  evaluateDescriptive,
  getAttemptById
};
