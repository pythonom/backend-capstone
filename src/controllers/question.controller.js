const Question = require('../models/Question');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logAction } = require('../services/audit.service');
const { AUDIT_ACTIONS, QUESTION_TYPES } = require('../utils/constants');

const createQuestion = async (req, res, next) => {
  try {
    const {
      title,
      type = QUESTION_TYPES.MCQ,
      subject,
      topic,
      difficulty,
      marks,
      negativeMarks,
      options,
      correctAnswer,
      explanation
    } = req.body;

    // Validate MCQ options and correctAnswer
    if (type === QUESTION_TYPES.MCQ) {
      if (!Array.isArray(options) || options.length < 2) {
        throw new ApiError(400, 'MCQ questions require at least 2 options');
      }
      const optionIds = options.map((opt) => opt.id);
      if (!optionIds.includes(correctAnswer)) {
        throw new ApiError(
          400,
          `The correctAnswer '${correctAnswer}' does not match any provided option ID: [${optionIds.join(', ')}]`
        );
      }
    }

    const question = await Question.create({
      title,
      type,
      subject,
      topic,
      difficulty,
      marks,
      negativeMarks: negativeMarks || 0,
      options: options || [],
      correctAnswer,
      explanation: explanation || '',
      createdBy: req.user._id
    });

    await logAction({
      action: AUDIT_ACTIONS.QUESTION_CREATE,
      userId: req.user._id,
      userRole: req.user.role,
      details: { questionId: question._id, title: question.title, subject, topic },
      req
    });

    res.status(201).json(new ApiResponse(201, question, 'Question created successfully'));
  } catch (error) {
    next(error);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, type, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (subject) filter.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
    if (topic) filter.topic = { $regex: new RegExp(`^${topic}$`, 'i') };
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('createdBy', 'name email role')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Question.countDocuments(filter)
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          questions,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        },
        'Questions fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId).populate(
      'createdBy',
      'name email role'
    );
    if (!question) {
      throw new ApiError(404, 'Question not found');
    }
    res.status(200).json(new ApiResponse(200, question, 'Question retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findById(questionId);
    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    // Validate options and correctAnswer if updated
    const newType = req.body.type || question.type;
    const newOptions = req.body.options || question.options;
    const newCorrectAnswer = req.body.correctAnswer || question.correctAnswer;

    if (newType === QUESTION_TYPES.MCQ && newOptions && newCorrectAnswer) {
      const optionIds = newOptions.map((opt) => opt.id);
      if (!optionIds.includes(newCorrectAnswer)) {
        throw new ApiError(
          400,
          `The correctAnswer '${newCorrectAnswer}' does not match any provided option ID: [${optionIds.join(', ')}]`
        );
      }
    }

    Object.assign(question, req.body);
    await question.save();

    await logAction({
      action: AUDIT_ACTIONS.QUESTION_UPDATE,
      userId: req.user._id,
      userRole: req.user.role,
      details: { questionId: question._id },
      req
    });

    res.status(200).json(new ApiResponse(200, question, 'Question updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.questionId);
    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    await logAction({
      action: AUDIT_ACTIONS.QUESTION_DELETE,
      userId: req.user._id,
      userRole: req.user.role,
      details: { questionId: req.params.questionId },
      req
    });

    res.status(200).json(new ApiResponse(200, null, 'Question deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
};
