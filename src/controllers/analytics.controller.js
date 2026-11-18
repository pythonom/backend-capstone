const Examination = require('../models/Examination');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const {
  getExamPerformanceOverview,
  getQuestionWisePerformance,
  getSectionWisePerformance,
  getExamStudentLeaderboard
} = require('../services/analytics.service');
const { ROLES } = require('../utils/constants');

const verifyFacultyExamAccess = async (examId, user) => {
  const exam = await Examination.findById(examId);
  if (!exam) {
    throw new ApiError(404, 'Examination not found');
  }
  if (user.role === ROLES.FACULTY && exam.facultyId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to view analytics for this examination');
  }
  return exam;
};

const getOverview = async (req, res, next) => {
  try {
    const { examId } = req.params;
    await verifyFacultyExamAccess(examId, req.user);

    const overview = await getExamPerformanceOverview(examId);
    res.status(200).json(new ApiResponse(200, overview, 'Exam performance overview generated'));
  } catch (error) {
    next(error);
  }
};

const getQuestionAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    await verifyFacultyExamAccess(examId, req.user);

    const questionAnalytics = await getQuestionWisePerformance(examId);
    res.status(200).json(
      new ApiResponse(200, questionAnalytics, 'Question-wise analytics generated')
    );
  } catch (error) {
    next(error);
  }
};

const getSectionAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    await verifyFacultyExamAccess(examId, req.user);

    const sectionAnalytics = await getSectionWisePerformance(examId);
    res.status(200).json(
      new ApiResponse(200, sectionAnalytics, 'Section-wise performance analytics generated')
    );
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const { examId } = req.params;
    await verifyFacultyExamAccess(examId, req.user);

    const leaderboard = await getExamStudentLeaderboard(examId);
    res.status(200).json(
      new ApiResponse(200, leaderboard, 'Student leaderboard generated successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getQuestionAnalytics,
  getSectionAnalytics,
  getLeaderboard
};
