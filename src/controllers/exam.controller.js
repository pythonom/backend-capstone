const Examination = require('../models/Examination');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logAction } = require('../services/audit.service');
const { broadcastNotification, notifyGroup, notifyStudent } = require('../services/socket.service');
const { ROLES, EXAM_STATUS, ATTEMPT_STATUS, AUDIT_ACTIONS } = require('../utils/constants');

const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      instructions,
      course,
      assignedGroups = [],
      assignedStudents = [],
      questions,
      passingMarks,
      durationMinutes,
      startTime,
      endTime,
      settings = {}
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      throw new ApiError(400, 'End time must be after start time');
    }

    // Verify all question IDs exist in Question bank
    const questionIds = questions.map((q) => q.questionId);
    const existingQuestions = await Question.find({ _id: { $in: questionIds } });
    if (existingQuestions.length !== questionIds.length) {
      throw new ApiError(400, 'One or more question IDs provided do not exist in the question bank');
    }

    const questionMap = new Map();
    existingQuestions.forEach((q) => questionMap.set(q._id.toString(), q));

    // Calculate total marks from question configurations
    let totalMarks = 0;
    const resolvedQuestions = questions.map((q) => {
      const dbQ = questionMap.get(q.questionId.toString());
      const assignedMarks = q.marks !== undefined ? q.marks : dbQ.marks;
      const assignedNeg =
        q.negativeMarks !== undefined
          ? q.negativeMarks
          : settings.defaultNegativeMarksPerQuestion || dbQ.negativeMarks || 0;
      totalMarks += assignedMarks;
      return {
        questionId: q.questionId,
        marks: assignedMarks,
        negativeMarks: assignedNeg
      };
    });

    const exam = await Examination.create({
      title,
      description,
      instructions,
      course,
      facultyId: req.user._id,
      assignedGroups,
      assignedStudents,
      questions: resolvedQuestions,
      totalMarks,
      passingMarks: passingMarks !== undefined ? passingMarks : Math.round(totalMarks * 0.4),
      durationMinutes,
      startTime: start,
      endTime: end,
      status: EXAM_STATUS.DRAFT,
      settings
    });

    await logAction({
      action: AUDIT_ACTIONS.EXAM_CREATE,
      userId: req.user._id,
      userRole: req.user.role,
      examId: exam._id,
      details: { title: exam.title, totalMarks, durationMinutes },
      req
    });

    res.status(201).json(new ApiResponse(201, exam, 'Examination created successfully'));
  } catch (error) {
    next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const { status, course, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    if (req.user.role === ROLES.STUDENT) {
      // Students can only see published exams assigned to them or their group
      const studentGroup = req.user.academicGroup;
      const filter = {
        status: EXAM_STATUS.PUBLISHED,
        $or: [
          { assignedStudents: req.user._id },
          ...(studentGroup ? [{ assignedGroups: studentGroup }] : [])
        ]
      };

      if (course) filter.course = { $regex: new RegExp(`^${course}$`, 'i') };
      if (search) filter.title = { $regex: search, $options: 'i' };

      const [exams, total] = await Promise.all([
        Examination.find(filter)
          .select('-questions.correctAnswer')
          .populate('facultyId', 'name email')
          .populate('assignedGroups', 'name code')
          .skip(skip)
          .limit(limitNum)
          .sort({ startTime: 1 }),
        Examination.countDocuments(filter)
      ]);

      // Check student attempt status for each exam
      const examIds = exams.map((e) => e._id);
      const studentAttempts = await ExamAttempt.find({
        examId: { $in: examIds },
        studentId: req.user._id
      }).select('examId status score attemptNumber');

      const attemptMap = new Map();
      studentAttempts.forEach((att) => {
        attemptMap.set(att.examId.toString(), att);
      });

      const now = new Date();
      const enrichedExams = exams.map((exam) => {
        const examObj = exam.toObject();
        const attempt = attemptMap.get(exam._id.toString());
        examObj.userAttempt = attempt || null;
        examObj.isUpcoming = now < new Date(exam.startTime);
        examObj.isActive = now >= new Date(exam.startTime) && now <= new Date(exam.endTime);
        examObj.isClosed = now > new Date(exam.endTime);
        return examObj;
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            exams: enrichedExams,
            pagination: {
              total,
              page: pageNum,
              limit: limitNum,
              pages: Math.ceil(total / limitNum)
            }
          },
          'Assigned examinations fetched successfully'
        )
      );
    }

    // Faculty and Admin view
    const filter = {};
    if (req.user.role === ROLES.FACULTY) {
      filter.facultyId = req.user._id;
    }
    if (status) filter.status = status;
    if (course) filter.course = { $regex: new RegExp(`^${course}$`, 'i') };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } }
      ];
    }

    const [exams, total] = await Promise.all([
      Examination.find(filter)
        .populate('facultyId', 'name email')
        .populate('assignedGroups', 'name code')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Examination.countDocuments(filter)
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          exams,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        },
        'Examinations fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Examination.findById(examId)
      .populate('facultyId', 'name email')
      .populate('assignedGroups', 'name code department semester')
      .populate('assignedStudents', 'name email studentId')
      .populate('questions.questionId');

    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (req.user.role === ROLES.STUDENT) {
      // Validate student assignment
      const studentId = req.user._id.toString();
      const studentGroupId = req.user.academicGroup ? req.user.academicGroup.toString() : null;

      const isDirectlyAssigned = exam.assignedStudents.some(
        (s) => (s._id || s).toString() === studentId
      );
      const isGroupAssigned =
        studentGroupId &&
        exam.assignedGroups.some((g) => (g._id || g).toString() === studentGroupId);

      if (!isDirectlyAssigned && !isGroupAssigned) {
        throw new ApiError(403, 'You are not assigned or authorized to access this examination');
      }

      if (exam.status !== EXAM_STATUS.PUBLISHED) {
        throw new ApiError(403, 'This examination is not yet published');
      }

      // Hide questions and answer keys before exam starts or outside attempt context
      const studentSafeExam = exam.toObject();
      delete studentSafeExam.questions; // Questions are delivered via attempt/start endpoint!

      const attempt = await ExamAttempt.findOne({
        examId: exam._id,
        studentId: req.user._id
      }).select('status score attemptNumber startTime expiresAt submittedAt');

      studentSafeExam.userAttempt = attempt || null;
      return res.status(200).json(
        new ApiResponse(200, studentSafeExam, 'Examination details fetched')
      );
    }

    // Faculty: verify ownership or admin
    if (req.user.role === ROLES.FACULTY && exam.facultyId._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to view this examination');
    }

    res.status(200).json(new ApiResponse(200, exam, 'Examination fetched successfully'));
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Examination.findById(examId);

    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to update this examination');
    }

    // Prevent modifying core exam structure if attempts already exist
    const attemptCount = await ExamAttempt.countDocuments({ examId });
    if (attemptCount > 0 && req.body.questions) {
      throw new ApiError(
        400,
        'Cannot modify questions of an examination for which attempts have already been initiated'
      );
    }

    if (req.body.questions) {
      const questionIds = req.body.questions.map((q) => q.questionId);
      const dbQuestions = await Question.find({ _id: { $in: questionIds } });
      if (dbQuestions.length !== questionIds.length) {
        throw new ApiError(400, 'One or more question IDs do not exist');
      }
      let totalMarks = 0;
      const questionMap = new Map();
      dbQuestions.forEach((q) => questionMap.set(q._id.toString(), q));
      req.body.questions = req.body.questions.map((q) => {
        const dbQ = questionMap.get(q.questionId.toString());
        const assignedMarks = q.marks !== undefined ? q.marks : dbQ.marks;
        totalMarks += assignedMarks;
        return {
          questionId: q.questionId,
          marks: assignedMarks,
          negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0
        };
      });
      req.body.totalMarks = totalMarks;
    }

    Object.assign(exam, req.body);
    await exam.save();

    await logAction({
      action: AUDIT_ACTIONS.EXAM_UPDATE,
      userId: req.user._id,
      userRole: req.user.role,
      examId: exam._id,
      details: { updates: Object.keys(req.body) },
      req
    });

    res.status(200).json(new ApiResponse(200, exam, 'Examination updated successfully'));
  } catch (error) {
    next(error);
  }
};

const publishExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Examination.findById(examId);

    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to publish this examination');
    }

    if (!exam.questions || exam.questions.length === 0) {
      throw new ApiError(400, 'Cannot publish an examination without any questions');
    }

    exam.status = EXAM_STATUS.PUBLISHED;
    await exam.save();

    await logAction({
      action: AUDIT_ACTIONS.EXAM_PUBLISH,
      userId: req.user._id,
      userRole: req.user.role,
      examId: exam._id,
      details: { title: exam.title },
      req
    });

    // Real-time notification via Socket.IO
    broadcastNotification('exam:published', {
      examId: exam._id,
      title: exam.title,
      course: exam.course,
      startTime: exam.startTime,
      endTime: exam.endTime
    });

    res.status(200).json(new ApiResponse(200, exam, 'Examination published successfully'));
  } catch (error) {
    next(error);
  }
};

const releaseResults = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Examination.findById(examId);

    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to release results for this examination');
    }

    exam.settings.isResultReleased = true;
    if (req.body.showQuestionReview !== undefined) {
      exam.settings.showQuestionReviewToStudent = req.body.showQuestionReview;
    }
    await exam.save();

    await logAction({
      action: AUDIT_ACTIONS.RESULT_RELEASE,
      userId: req.user._id,
      userRole: req.user.role,
      examId: exam._id,
      details: { title: exam.title },
      req
    });

    // Real-time broadcast that results have been published
    broadcastNotification('exam:results_released', {
      examId: exam._id,
      title: exam.title
    });

    res.status(200).json(
      new ApiResponse(200, exam, 'Results have been released to students')
    );
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Examination.findById(examId);

    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to delete this examination');
    }

    const attemptsCount = await ExamAttempt.countDocuments({ examId });
    if (attemptsCount > 0) {
      throw new ApiError(
        400,
        'Cannot delete examination because students have already attempted it'
      );
    }

    await Examination.findByIdAndDelete(examId);

    await logAction({
      action: AUDIT_ACTIONS.EXAM_DELETE,
      userId: req.user._id,
      userRole: req.user.role,
      examId,
      req
    });

    res.status(200).json(new ApiResponse(200, null, 'Examination deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  publishExam,
  releaseResults,
  deleteExam
};
