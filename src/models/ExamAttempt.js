const mongoose = require('mongoose');
const { ATTEMPT_STATUS } = require('../utils/constants');

const responseOptionSchema = new mongoose.Schema(
  {
    id: String,
    text: String
  },
  { _id: false }
);

const shuffledQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    options: [responseOptionSchema]
  },
  { _id: false }
);

const studentResponseSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: String,
      default: null
    },
    descriptiveAnswer: {
      type: String,
      default: ''
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    marksAwarded: {
      type: Number,
      default: 0
    },
    maxMarks: {
      type: Number,
      default: 0
    },
    negativeMarksApplied: {
      type: Number,
      default: 0
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    facultyFeedback: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    totalScore: {
      type: Number,
      default: 0
    },
    maxScore: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    },
    correctAnswersCount: {
      type: Number,
      default: 0
    },
    wrongAnswersCount: {
      type: Number,
      default: 0
    },
    unansweredCount: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    submittedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ATTEMPT_STATUS),
      default: ATTEMPT_STATUS.IN_PROGRESS,
      index: true
    },
    shuffledQuestions: [shuffledQuestionSchema],
    responses: [studentResponseSchema],
    score: {
      type: scoreSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

examAttemptSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
