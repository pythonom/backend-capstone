const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, userId, examId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (examId) filter.examId = examId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role')
        .populate('examId', 'title course')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          logs,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        },
        'Audit logs fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
