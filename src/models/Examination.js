const mongoose = require('mongoose');
const { EXAM_STATUS } = require('../utils/constants');

const examQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0.5
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const examSettingsSchema = new mongoose.Schema(
  {
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    randomizeOptions: {
      type: Boolean,
      default: true
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    defaultNegativeMarksPerQuestion: {
      type: Number,
      default: 0,
      min: 0
    },
    allowRetake: {
      type: Boolean,
      default: false
    },
    maxRetakes: {
      type: Number,
      default: 0,
      min: 0
    },
    isResultReleased: {
      type: Boolean,
      default: false
    },
    showQuestionReviewToStudent: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const examinationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    instructions: {
      type: String,
      trim: true,
      default: 'Read all questions carefully. Time limit will be strictly enforced.'
    },
    course: {
      type: String,
      required: [true, 'Course name/code is required'],
      trim: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicGroup'
      }
    ],
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    questions: [examQuestionSchema],
    totalMarks: {
      type: Number,
      default: 0
    },
    passingMarks: {
      type: Number,
      default: 0
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    status: {
      type: String,
      enum: Object.values(EXAM_STATUS),
      default: EXAM_STATUS.DRAFT,
      index: true
    },
    settings: {
      type: examSettingsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

examinationSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Examination', examinationSchema);
