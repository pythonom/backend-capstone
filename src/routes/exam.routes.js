const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const validate = require('../middleware/validate');
const examValidation = require('../validations/exam.validation');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// List exams (students see assigned published exams; faculty see their created exams)
router.get('/', validate(examValidation.listExams), examController.getExams);

// Get single exam details (sanitized view for student; full view for faculty)
router.get('/:examId', validate(examValidation.getExamById), examController.getExamById);

// Faculty & Admin actions
router.post(
  '/',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(examValidation.createExam),
  examController.createExam
);

router.patch(
  '/:examId',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(examValidation.updateExam),
  examController.updateExam
);

router.post(
  '/:examId/publish',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(examValidation.getExamById),
  examController.publishExam
);

router.post(
  '/:examId/release-results',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(examValidation.getExamById),
  examController.releaseResults
);

router.delete(
  '/:examId',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  validate(examValidation.getExamById),
  examController.deleteExam
);

module.exports = router;
