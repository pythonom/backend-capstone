const Examination = require('../models/Examination');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const {
  prepareShuffledQuestions,
  evaluateAttempt,
  evaluateDescriptiveResponses
} = require('../services/evaluation.service');
const { emitExamEvent, notifyStudent } = require('../services/socket.service');
const { logAction } = require('../services/audit.service');
const {
  ROLES,
  EXAM_STATUS,
  ATTEMPT_STATUS,
  AUDIT_ACTIONS,
  QUESTION_TYPES
} = require('../utils/constants');

const startExamAttempt = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const student = req.user;

    const exam = await Examination.findById(examId);
    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (exam.status !== EXAM_STATUS.PUBLISHED) {
      throw new ApiError(400, 'Examination is not active or published');
    }

    // Check student assignment
    const studentIdStr = student._id.toString();
    const studentGroupId = student.academicGroup ? student.academicGroup.toString() : null;

    const isDirectlyAssigned = exam.assignedStudents.some(
      (s) => s.toString() === studentIdStr
    );
    const isGroupAssigned =
      studentGroupId &&
      exam.assignedGroups.some((g) => g.toString() === studentGroupId);

    if (!isDirectlyAssigned && !isGroupAssigned) {
      throw new ApiError(403, 'You are not assigned to take this examination');
    }

    const now = new Date();
    if (now < new Date(exam.startTime)) {
      throw new ApiError(
        400,
        `Examination has not started yet. It begins at ${new Date(exam.startTime).toISOString()}`
      );
    }
    if (now > new Date(exam.endTime)) {
      throw new ApiError(400, 'Examination schedule has already closed');
    }

    // Check existing attempts
    const existingAttempts = await ExamAttempt.find({
      examId: exam._id,
      studentId: student._id
    }).sort({ attemptNumber: -1 });

    if (existingAttempts.length > 0) {
      const activeAttempt = existingAttempts.find(
        (att) => att.status === ATTEMPT_STATUS.IN_PROGRESS
      );

      // If there is an active ongoing attempt, check if expired
      if (activeAttempt) {
        if (now > new Date(activeAttempt.expiresAt)) {
          // Attempt expired -> auto-submit
          await evaluateAttempt(activeAttempt, exam, activeAttempt.responses);
          activeAttempt.status = ATTEMPT_STATUS.EXPIRED;
          await activeAttempt.save();
        } else {
          // Return the current active attempt so the student can resume without losing time!
          const dbQuestions = await Question.find({
            _id: { $in: exam.questions.map((q) => q.questionId) }
          });
          const qMap = new Map();
          dbQuestions.forEach((q) => qMap.set(q._id.toString(), q));

          const sanitizedQuestions = activeAttempt.shuffledQuestions.map((sq) => {
            const dbQ = qMap.get(sq.questionId.toString());
            return {
              questionId: sq.questionId,
              order: sq.order,
              title: dbQ?.title,
              type: dbQ?.type,
              subject: dbQ?.subject,
              topic: dbQ?.topic,
              marks: dbQ?.marks,
              options: sq.options
            };
          });

          return res.status(200).json(
            new ApiResponse(
              200,
              {
                attemptId: activeAttempt._id,
                startTime: activeAttempt.startTime,
                expiresAt: activeAttempt.expiresAt,
                timeRemainingSeconds: Math.max(
                  0,
                  Math.floor((new Date(activeAttempt.expiresAt).getTime() - now.getTime()) / 1000)
                ),
                questions: sanitizedQuestions,
                savedResponses: activeAttempt.responses
              },
              'Resumed existing examination attempt'
            )
          );
        }
      }

      // Check retake policy
      const completedCount = existingAttempts.filter(
        (a) => a.status !== ATTEMPT_STATUS.IN_PROGRESS
      ).length;

      if (!exam.settings?.allowRetake) {
        throw new ApiError(400, 'You have already submitted this examination and retakes are not permitted');
      }

      const maxRetakes = exam.settings.maxRetakes || 1;
      if (completedCount >= maxRetakes + 1) {
        throw new ApiError(
          400,
          `Maximum attempt limit reached (${maxRetakes + 1} total allowed)`
        );
      }
    }

    // Calculate expiration time: min of (now + duration) and exam.endTime
    const durationEnd = new Date(now.getTime() + exam.durationMinutes * 60000);
    const expiresAt = durationEnd < new Date(exam.endTime) ? durationEnd : new Date(exam.endTime);

    // Fetch questions from question bank
    const questionIds = exam.questions.map((q) => q.questionId);
    const dbQuestions = await Question.find({ _id: { $in: questionIds } });

    // Prepare randomized questions
    const shuffledQuestions = prepareShuffledQuestions(exam, dbQuestions);

    const newAttemptNumber = existingAttempts.length + 1;

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: student._id,
      attemptNumber: newAttemptNumber,
      startTime: now,
      expiresAt,
      status: ATTEMPT_STATUS.IN_PROGRESS,
      shuffledQuestions,
      responses: []
    });

    // Notify faculty proctoring dashboard in real-time
    emitExamEvent(exam._id.toString(), 'exam:attempt_started', {
      examId: exam._id,
      attemptId: attempt._id,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      attemptNumber: newAttemptNumber,
      startTime: now
    });

    await logAction({
      action: AUDIT_ACTIONS.ATTEMPT_START,
      userId: student._id,
      userRole: student.role,
      examId: exam._id,
      details: { attemptId: attempt._id, attemptNumber: newAttemptNumber },
      req
    });

    // Provide student safe question view
    const qMap = new Map();
    dbQuestions.forEach((q) => qMap.set(q._id.toString(), q));

    const sanitizedQuestions = shuffledQuestions.map((sq) => {
      const dbQ = qMap.get(sq.questionId.toString());
      return {
        questionId: sq.questionId,
        order: sq.order,
        title: dbQ?.title,
        type: dbQ?.type,
        subject: dbQ?.subject,
        topic: dbQ?.topic,
        marks: dbQ?.marks,
        options: sq.options
      };
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          attemptId: attempt._id,
          startTime: attempt.startTime,
          expiresAt: attempt.expiresAt,
          durationMinutes: exam.durationMinutes,
          timeRemainingSeconds: Math.floor(
            (new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000
          ),
          totalQuestions: sanitizedQuestions.length,
          questions: sanitizedQuestions
        },
        'Examination attempt started successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

const saveAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption, descriptiveAnswer } = req.body;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      throw new ApiError(404, 'Attempt not found');
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to this attempt');
    }

    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `Cannot save answer. Attempt status is '${attempt.status}'`);
    }

    const now = new Date();
    // 30 seconds grace period for network latency
    if (now.getTime() > new Date(attempt.expiresAt).getTime() + 30000) {
      attempt.status = ATTEMPT_STATUS.EXPIRED;
      await attempt.save();
      throw new ApiError(400, 'Examination duration has expired. Responses are locked.');
    }

    // Verify question is part of this attempt
    const isValidQuestion = attempt.shuffledQuestions.some(
      (sq) => sq.questionId.toString() === questionId
    );
    if (!isValidQuestion) {
      throw new ApiError(400, 'Question ID does not belong to this examination');
    }

    // Find if response exists or insert
    const existingIndex = attempt.responses.findIndex(
      (r) => r.questionId.toString() === questionId
    );

    if (existingIndex > -1) {
      if (selectedOption !== undefined) {
        attempt.responses[existingIndex].selectedOption = selectedOption;
      }
      if (descriptiveAnswer !== undefined) {
        attempt.responses[existingIndex].descriptiveAnswer = descriptiveAnswer;
      }
    } else {
      attempt.responses.push({
        questionId,
        selectedOption: selectedOption || null,
        descriptiveAnswer: descriptiveAnswer || ''
      });
    }

    await attempt.save();

    res.status(200).json(new ApiResponse(200, { questionId }, 'Answer saved successfully'));
  } catch (error) {
    next(error);
  }
};

const submitExamAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { responses = [] } = req.body;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      throw new ApiError(404, 'Attempt not found');
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Unauthorized access to this attempt');
    }

    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `This attempt has already been submitted or completed with status '${attempt.status}'`);
    }

    const exam = await Examination.findById(attempt.examId);
    if (!exam) {
      throw new ApiError(404, 'Associated examination not found');
    }

    // Merge responses: if client provided array, use or overlay with already saved responses
    const responseMap = new Map();
    attempt.responses.forEach((r) => responseMap.set(r.questionId.toString(), r));
    responses.forEach((r) => {
      if (r.questionId) {
        responseMap.set(r.questionId.toString(), r);
      }
    });

    const combinedResponses = Array.from(responseMap.values());

    // Automatic evaluation of objective questions and scoring
    await evaluateAttempt(attempt, exam, combinedResponses);
    await attempt.save();

    // Real-time notification to faculty monitoring dashboard
    emitExamEvent(exam._id.toString(), 'exam:attempt_submitted', {
      examId: exam._id,
      attemptId: attempt._id,
      studentId: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      submittedAt: attempt.submittedAt,
      totalScore: attempt.score.totalScore,
      maxScore: attempt.score.maxScore,
      status: attempt.status
    });

    await logAction({
      action: AUDIT_ACTIONS.ATTEMPT_SUBMIT,
      userId: req.user._id,
      userRole: req.user.role,
      examId: exam._id,
      details: {
        attemptId: attempt._id,
        score: attempt.score.totalScore,
        status: attempt.status
      },
      req
    });

    const isResultReleased = exam.settings?.isResultReleased;
    const responseData = {
      attemptId: attempt._id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      isResultReleased
    };

    if (isResultReleased) {
      responseData.score = attempt.score;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        responseData,
        isResultReleased
          ? 'Examination submitted and evaluated successfully'
          : 'Examination submitted successfully. Results will be available once released by the instructor.'
      )
    );
  } catch (error) {
    next(error);
  }
};

const evaluateDescriptive = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { evaluations } = req.body;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      throw new ApiError(404, 'Attempt not found');
    }

    const exam = await Examination.findById(attempt.examId);
    if (!exam) {
      throw new ApiError(404, 'Associated examination not found');
    }

    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to grade this examination');
    }

    await evaluateDescriptiveResponses(attempt, exam, evaluations, req.user._id);
    await attempt.save();

    await logAction({
      action: AUDIT_ACTIONS.DESCRIPTIVE_EVALUATE,
      userId: req.user._id,
      userRole: req.user.role,
      examId: exam._id,
      details: { attemptId: attempt._id, evaluatedCount: evaluations.length },
      req
    });

    // Notify student via socket
    notifyStudent(attempt.studentId.toString(), 'exam:evaluated', {
      examId: exam._id,
      attemptId: attempt._id,
      status: attempt.status
    });

    res.status(200).json(
      new ApiResponse(200, attempt, 'Descriptive answers evaluated and scores updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate('studentId', 'name email studentId')
      .populate('responses.questionId');

    if (!attempt) {
      throw new ApiError(404, 'Attempt not found');
    }

    const exam = await Examination.findById(attempt.examId);
    if (!exam) {
      throw new ApiError(404, 'Associated examination not found');
    }

    if (req.user.role === ROLES.STUDENT) {
      if (attempt.studentId._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized to view this attempt result');
      }

      if (!exam.settings?.isResultReleased) {
        throw new ApiError(
          403,
          'Examination results have not yet been released by the instructor'
        );
      }

      const resultObj = attempt.toObject();

      // If student review is not permitted, omit per-question correct answer keys
      if (!exam.settings?.showQuestionReviewToStudent) {
        delete resultObj.responses;
        delete resultObj.shuffledQuestions;
      } else {
        // Strip out faculty internal notes if any, sanitize question options
        resultObj.responses = resultObj.responses.map((resp) => {
          const q = resp.questionId;
          return {
            questionId: q?._id,
            title: q?.title,
            type: q?.type,
            options: q?.options,
            correctAnswer: q?.correctAnswer,
            explanation: q?.explanation,
            selectedOption: resp.selectedOption,
            descriptiveAnswer: resp.descriptiveAnswer,
            isCorrect: resp.isCorrect,
            marksAwarded: resp.marksAwarded,
            maxMarks: resp.maxMarks,
            facultyFeedback: resp.facultyFeedback
          };
        });
      }

      return res.status(200).json(
        new ApiResponse(200, resultObj, 'Examination result retrieved')
      );
    }

    // Faculty or Admin
    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to view attempts for this examination');
    }

    res.status(200).json(new ApiResponse(200, attempt, 'Attempt retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getExamAttemptsForFaculty = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const exam = await Examination.findById(examId);
    if (!exam) {
      throw new ApiError(404, 'Examination not found');
    }

    if (req.user.role === ROLES.FACULTY && exam.facultyId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to view attempts for this examination');
    }

    const filter = { examId };
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [attempts, total] = await Promise.all([
      ExamAttempt.find(filter)
        .populate('studentId', 'name email studentId academicGroup')
        .skip(skip)
        .limit(limitNum)
        .sort({ submittedAt: -1, createdAt: -1 }),
      ExamAttempt.countDocuments(filter)
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          attempts,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        },
        'Exam attempts fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startExamAttempt,
  saveAnswer,
  submitExamAttempt,
  evaluateDescriptive,
  getAttemptResult,
  getExamAttemptsForFaculty
};
