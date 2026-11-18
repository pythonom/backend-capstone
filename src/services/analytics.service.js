const mongoose = require('mongoose');
const ExamAttempt = require('../models/ExamAttempt');
const Examination = require('../models/Examination');
const { ATTEMPT_STATUS } = require('../utils/constants');

/**
 * Exam overview analytics using aggregation
 */
const getExamPerformanceOverview = async (examId) => {
  const objectId = new mongoose.Types.ObjectId(examId);

  const exam = await Examination.findById(objectId);
  if (!exam) return null;

  const result = await ExamAttempt.aggregate([
    {
      $match: {
        examId: objectId,
        status: { $in: [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.EVALUATED] }
      }
    },
    {
      $group: {
        _id: '$examId',
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: '$score.totalScore' },
        highestScore: { $max: '$score.totalScore' },
        lowestScore: { $min: '$score.totalScore' },
        averagePercentage: { $avg: '$score.percentage' },
        passedCount: {
          $sum: { $cond: [{ $eq: ['$score.passed', true] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$score.passed', false] }, 1, 0] }
        },
        scores: { $push: '$score.totalScore' }
      }
    },
    {
      $project: {
        _id: 0,
        examId: '$_id',
        totalSubmissions: 1,
        averageScore: { $round: ['$averageScore', 2] },
        highestScore: { $round: ['$highestScore', 2] },
        lowestScore: { $round: ['$lowestScore', 2] },
        averagePercentage: { $round: ['$averagePercentage', 2] },
        passedCount: 1,
        failedCount: 1,
        passRatePercentage: {
          $cond: [
            { $gt: ['$totalSubmissions', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$passedCount', '$totalSubmissions'] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        }
      }
    }
  ]);

  // Also count active in-progress attempts
  const activeAttemptsCount = await ExamAttempt.countDocuments({
    examId: objectId,
    status: ATTEMPT_STATUS.IN_PROGRESS
  });

  const overview = result.length > 0 ? result[0] : {
    examId: objectId,
    totalSubmissions: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    averagePercentage: 0,
    passedCount: 0,
    failedCount: 0,
    passRatePercentage: 0
  };

  overview.activeAttemptsCount = activeAttemptsCount;
  overview.totalQuestions = exam.questions.length;
  overview.totalExamMarks = exam.totalMarks;
  overview.passingMarks = exam.passingMarks;

  return overview;
};

/**
 * Question-wise performance analysis using aggregation
 */
const getQuestionWisePerformance = async (examId) => {
  const objectId = new mongoose.Types.ObjectId(examId);

  return await ExamAttempt.aggregate([
    {
      $match: {
        examId: objectId,
        status: { $in: [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.EVALUATED] }
      }
    },
    { $unwind: '$responses' },
    {
      $group: {
        _id: '$responses.questionId',
        totalAttempts: { $sum: 1 },
        correctCount: {
          $sum: { $cond: [{ $eq: ['$responses.isCorrect', true] }, 1, 0] }
        },
        wrongCount: {
          $sum: { $cond: [{ $eq: ['$responses.isCorrect', false] }, 1, 0] }
        },
        unansweredCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$responses.selectedOption', null] },
                  { $eq: ['$responses.descriptiveAnswer', ''] }
                ]
              },
              1,
              0
            ]
          }
        },
        averageMarksAwarded: { $avg: '$responses.marksAwarded' },
        maxMarksPossible: { $first: '$responses.maxMarks' }
      }
    },
    {
      $lookup: {
        from: 'questions',
        localField: '_id',
        foreignField: '_id',
        as: 'questionDetails'
      }
    },
    { $unwind: '$questionDetails' },
    {
      $project: {
        _id: 0,
        questionId: '$_id',
        title: '$questionDetails.title',
        type: '$questionDetails.type',
        subject: '$questionDetails.subject',
        topic: '$questionDetails.topic',
        difficulty: '$questionDetails.difficulty',
        maxMarks: '$maxMarksPossible',
        totalAttempts: 1,
        correctCount: 1,
        wrongCount: 1,
        unansweredCount: 1,
        averageMarksAwarded: { $round: ['$averageMarksAwarded', 2] },
        accuracyRatePercentage: {
          $cond: [
            { $gt: ['$totalAttempts', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$correctCount', '$totalAttempts'] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        }
      }
    },
    { $sort: { accuracyRatePercentage: 1 } } // Show toughest questions first
  ]);
};

/**
 * Section/Academic Group performance comparison
 */
const getSectionWisePerformance = async (examId) => {
  const objectId = new mongoose.Types.ObjectId(examId);

  return await ExamAttempt.aggregate([
    {
      $match: {
        examId: objectId,
        status: { $in: [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.EVALUATED] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'academicgroups',
        localField: 'student.academicGroup',
        foreignField: '_id',
        as: 'group'
      }
    },
    {
      $unwind: {
        path: '$group',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: { $ifNull: ['$group._id', 'Unassigned'] },
        groupName: { $first: { $ifNull: ['$group.name', 'General / Unassigned'] } },
        groupCode: { $first: { $ifNull: ['$group.code', 'N/A'] } },
        department: { $first: { $ifNull: ['$group.department', 'N/A'] } },
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: '$score.totalScore' },
        highestScore: { $max: '$score.totalScore' },
        lowestScore: { $min: '$score.totalScore' },
        passedCount: {
          $sum: { $cond: [{ $eq: ['$score.passed', true] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        groupId: '$_id',
        groupName: 1,
        groupCode: 1,
        department: 1,
        totalSubmissions: 1,
        averageScore: { $round: ['$averageScore', 2] },
        highestScore: { $round: ['$highestScore', 2] },
        lowestScore: { $round: ['$lowestScore', 2] },
        passedCount: 1,
        passRatePercentage: {
          $cond: [
            { $gt: ['$totalSubmissions', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$passedCount', '$totalSubmissions'] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        }
      }
    },
    { $sort: { averageScore: -1 } }
  ]);
};

/**
 * Student leaderboard / ranking for an exam
 */
const getExamStudentLeaderboard = async (examId) => {
  const objectId = new mongoose.Types.ObjectId(examId);

  return await ExamAttempt.aggregate([
    {
      $match: {
        examId: objectId,
        status: { $in: [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.EVALUATED] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'academicgroups',
        localField: 'student.academicGroup',
        foreignField: '_id',
        as: 'group'
      }
    },
    {
      $unwind: {
        path: '$group',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        studentId: '$student._id',
        studentName: '$student.name',
        studentEmail: '$student.email',
        studentRollNo: '$student.studentId',
        groupName: { $ifNull: ['$group.name', 'N/A'] },
        totalScore: '$score.totalScore',
        maxScore: '$score.maxScore',
        percentage: '$score.percentage',
        passed: '$score.passed',
        status: '$status',
        submittedAt: '$submittedAt',
        timeTakenSeconds: {
          $round: [
            {
              $divide: [{ $subtract: ['$submittedAt', '$startTime'] }, 1000]
            },
            0
          ]
        }
      }
    },
    { $sort: { totalScore: -1, timeTakenSeconds: 1 } },
    {
      $group: {
        _id: null,
        rankings: { $push: '$$ROOT' }
      }
    },
    {
      $unwind: {
        path: '$rankings',
        includeArrayIndex: 'rank'
      }
    },
    {
      $project: {
        _id: '$rankings._id',
        rank: { $add: ['$rank', 1] },
        studentId: '$rankings.studentId',
        studentName: '$rankings.studentName',
        studentEmail: '$rankings.studentEmail',
        studentRollNo: '$rankings.studentRollNo',
        groupName: '$rankings.groupName',
        totalScore: '$rankings.totalScore',
        maxScore: '$rankings.maxScore',
        percentage: '$rankings.percentage',
        passed: '$rankings.passed',
        status: '$rankings.status',
        submittedAt: '$rankings.submittedAt',
        timeTakenSeconds: '$rankings.timeTakenSeconds'
      }
    }
  ]);
};

module.exports = {
  getExamPerformanceOverview,
  getQuestionWisePerformance,
  getSectionWisePerformance,
  getExamStudentLeaderboard
};
