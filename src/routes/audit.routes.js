const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', auditController.getAuditLogs);

module.exports = router;
