const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const validate = require('../middleware/validate');
const attemptValidation = require('../validations/attempt.validation');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Student initiates an attempt
router.post(
  '/exams/:examId/start',
  authorize(ROLES.STUDENT),
  validate(attemptValidation.startExam),
  attemptController.startExamAttempt
);

// Student saves response for a question
router.post(
  '/:attemptId/save-answer',
  authorize(ROLES.STUDENT),
  validate(attemptValidation.saveAnswer),
  attemptController.saveAnswer
);

// Student submits the exam
router.post(
  '/:attemptId/submit',
  authorize(ROLES.STUDENT),
  validate(attemptValidation.submitExam),
  attemptController.submitExamAttempt
);

// Faculty evaluates descriptive questions
router.post(
  '/:attemptId/evaluate-descriptive',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(attemptValidation.evaluateDescriptive),
  attemptController.evaluateDescriptive
);

// View attempt result (subject to exam result release setting)
router.get(
  '/:attemptId/result',
  validate(attemptValidation.getAttemptById),
  attemptController.getAttemptResult
);

// Faculty lists attempts for an exam
router.get(
  '/exams/:examId/attempts',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(attemptValidation.startExam),
  attemptController.getExamAttemptsForFaculty
);

module.exports = router;
