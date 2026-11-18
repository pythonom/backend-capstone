const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const groupRoutes = require('./group.routes');
const questionRoutes = require('./question.routes');
const examRoutes = require('./exam.routes');
const attemptRoutes = require('./attempt.routes');
const analyticsRoutes = require('./analytics.routes');
const auditRoutes = require('./audit.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/attempts', attemptRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    service: 'Online Examination and Assessment Management API'
  });
});

module.exports = router;
