const mongoose = require('mongoose');
const { QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../utils/constants');

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title/content is required'],
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(QUESTION_TYPES),
      default: QUESTION_TYPES.MCQ
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      index: true
    },
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY_LEVELS),
      default: DIFFICULTY_LEVELS.MEDIUM,
      index: true
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0.5, 'Marks must be at least 0.5']
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: [0, 'Negative marks cannot be negative']
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (val) {
          if (this.type === QUESTION_TYPES.MCQ) {
            return Array.isArray(val) && val.length >= 2;
          }
          return true;
        },
        message: 'MCQ questions must have at least 2 options'
      }
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer/evaluation key is required'],
      trim: true
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Method to sanitize question for student attempts
questionSchema.methods.toStudentView = function () {
  const obj = this.toObject();
  delete obj.correctAnswer;
  delete obj.explanation;
  return obj;
};

module.exports = mongoose.model('Question', questionSchema);
