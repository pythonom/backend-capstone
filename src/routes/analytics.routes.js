const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const validate = require('../middleware/validate');
const examValidation = require('../validations/exam.validation');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);
router.use(authorize(ROLES.FACULTY, ROLES.ADMIN));

router.get(
  '/exams/:examId/overview',
  validate(examValidation.getExamById),
  analyticsController.getOverview
);

router.get(
  '/exams/:examId/questions',
  validate(examValidation.getExamById),
  analyticsController.getQuestionAnalytics
);

router.get(
  '/exams/:examId/sections',
  validate(examValidation.getExamById),
  analyticsController.getSectionAnalytics
);

router.get(
  '/exams/:examId/leaderboard',
  validate(examValidation.getExamById),
  analyticsController.getLeaderboard
);

module.exports = router;
