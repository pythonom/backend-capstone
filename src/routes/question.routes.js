const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const validate = require('../middleware/validate');
const questionValidation = require('../validations/question.validation');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);
router.use(authorize(ROLES.FACULTY, ROLES.ADMIN));

router.post(
  '/',
  validate(questionValidation.createQuestion),
  questionController.createQuestion
);

router.get(
  '/',
  validate(questionValidation.listQuestions),
  questionController.getQuestions
);

router.get(
  '/:questionId',
  validate(questionValidation.getQuestionById),
  questionController.getQuestionById
);

router.patch(
  '/:questionId',
  validate(questionValidation.updateQuestion),
  questionController.updateQuestion
);

router.delete(
  '/:questionId',
  validate(questionValidation.getQuestionById),
  questionController.deleteQuestion
);

module.exports = router;
