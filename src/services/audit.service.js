const AuditLog = require('../models/AuditLog');

const logAction = async ({ action, userId = null, userRole = null, examId = null, details = {}, req = null }) => {
  try {
    let ipAddress = '';
    let userAgent = '';

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      userAgent = req.headers['user-agent'] || '';
      if (!userId && req.user) {
        userId = req.user._id || req.user.id;
        userRole = req.user.role;
      }
    }

    const logEntry = new AuditLog({
      action,
      userId,
      userRole,
      examId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    // Audit logging should never crash the main request flow
    console.error('Audit log failed:', err.message);
    return null;
  }
};

module.exports = {
  logAction
};
