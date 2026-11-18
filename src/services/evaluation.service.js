const Question = require('../models/Question');
const { QUESTION_TYPES, ATTEMPT_STATUS } = require('../utils/constants');

/**
 * Fisher-Yates array shuffle algorithm
 */
const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Prepares questions for a student attempt with optional randomization
 */
const prepareShuffledQuestions = (exam, questions) => {
  let list = [...questions];

  if (exam.settings?.randomizeQuestions) {
    list = shuffleArray(list);
  }

  return list.map((q, idx) => {
    let options = [];
    if (q.type === QUESTION_TYPES.MCQ && Array.isArray(q.options)) {
      options = q.options.map((opt) => ({ id: opt.id, text: opt.text }));
      if (exam.settings?.randomizeOptions) {
        options = shuffleArray(options);
      }
    }

    return {
      questionId: q._id,
      order: idx + 1,
      options
    };
  });
};

/**
 * Evaluates student responses automatically for objective questions
 */
const evaluateAttempt = async (attempt, exam, submittedResponses = []) => {
  // Fetch full questions from DB with correct answers
  const questionIds = exam.questions.map((q) => q.questionId.toString());
  const dbQuestions = await Question.find({ _id: { $in: questionIds } });
  const questionMap = new Map();
  dbQuestions.forEach((q) => questionMap.set(q._id.toString(), q));

  // Build a map of exam question marks / negative marks override
  const examQuestionConfig = new Map();
  exam.questions.forEach((eq) => {
    examQuestionConfig.set(eq.questionId.toString(), {
      marks: eq.marks,
      negativeMarks: eq.negativeMarks
    });
  });

  // Map submitted responses by questionId
  const responseMap = new Map();
  submittedResponses.forEach((res) => {
    if (res.questionId) {
      responseMap.set(res.questionId.toString(), res);
    }
  });

  const responses = [];
  let totalScore = 0;
  let maxScore = 0;
  let correctAnswersCount = 0;
  let wrongAnswersCount = 0;
  let unansweredCount = 0;
  let hasPendingDescriptive = false;

  for (const eq of exam.questions) {
    const qIdStr = eq.questionId.toString();
    const question = questionMap.get(qIdStr);
    if (!question) continue;

    const assignedMarks = eq.marks || question.marks || 1;
    maxScore += assignedMarks;

    const submittedRes = responseMap.get(qIdStr);
    const selectedOption = submittedRes?.selectedOption || null;
    const descriptiveAnswer = submittedRes?.descriptiveAnswer || '';

    if (question.type === QUESTION_TYPES.MCQ) {
      if (!selectedOption) {
        // Unanswered
        unansweredCount++;
        responses.push({
          questionId: question._id,
          selectedOption: null,
          descriptiveAnswer: '',
          isCorrect: false,
          marksAwarded: 0,
          maxMarks: assignedMarks,
          negativeMarksApplied: 0
        });
      } else if (selectedOption.trim() === question.correctAnswer.trim()) {
        // Correct answer
        correctAnswersCount++;
        totalScore += assignedMarks;
        responses.push({
          questionId: question._id,
          selectedOption,
          descriptiveAnswer: '',
          isCorrect: true,
          marksAwarded: assignedMarks,
          maxMarks: assignedMarks,
          negativeMarksApplied: 0
        });
      } else {
        // Wrong answer - calculate negative marks
        wrongAnswersCount++;
        let penalty = 0;
        if (exam.settings?.negativeMarking) {
          penalty =
            eq.negativeMarks > 0
              ? eq.negativeMarks
              : question.negativeMarks > 0
              ? question.negativeMarks
              : exam.settings.defaultNegativeMarksPerQuestion || 0;
        }

        totalScore -= penalty;
        responses.push({
          questionId: question._id,
          selectedOption,
          descriptiveAnswer: '',
          isCorrect: false,
          marksAwarded: -penalty,
          maxMarks: assignedMarks,
          negativeMarksApplied: penalty
        });
      }
    } else if (question.type === QUESTION_TYPES.DESCRIPTIVE) {
      hasPendingDescriptive = true;
      responses.push({
        questionId: question._id,
        selectedOption: null,
        descriptiveAnswer: descriptiveAnswer.trim(),
        isCorrect: null,
        marksAwarded: 0,
        maxMarks: assignedMarks,
        negativeMarksApplied: 0,
        facultyFeedback: ''
      });
      if (!descriptiveAnswer.trim()) {
        unansweredCount++;
      }
    }
  }

  // Ensure total score is not less than 0
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 10000) / 100 : 0;
  const passed = finalScore >= (exam.passingMarks || 0);

  attempt.responses = responses;
  attempt.score = {
    totalScore: finalScore,
    maxScore,
    percentage,
    passed,
    correctAnswersCount,
    wrongAnswersCount,
    unansweredCount
  };

  attempt.status = hasPendingDescriptive ? ATTEMPT_STATUS.SUBMITTED : ATTEMPT_STATUS.EVALUATED;
  attempt.submittedAt = new Date();

  return attempt;
};

/**
 * Evaluates descriptive questions manually by faculty
 */
const evaluateDescriptiveResponses = async (attempt, exam, evaluations = [], facultyUserId) => {
  const evalMap = new Map();
  evaluations.forEach((ev) => evalMap.set(ev.questionId.toString(), ev));

  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let stillHasPending = false;

  for (const resp of attempt.responses) {
    const qIdStr = resp.questionId.toString();
    maxScore += resp.maxMarks || 0;

    if (evalMap.has(qIdStr)) {
      const evaluation = evalMap.get(qIdStr);
      const awarded = Math.min(Math.max(0, Number(evaluation.marksAwarded)), resp.maxMarks);
      resp.marksAwarded = awarded;
      resp.isCorrect = awarded > 0;
      resp.facultyFeedback = evaluation.feedback || '';
      resp.evaluatedBy = facultyUserId;
    }

    if (resp.isCorrect === null) {
      stillHasPending = true;
    }

    if (resp.isCorrect === true) correctCount++;
    else if (resp.isCorrect === false && (resp.selectedOption || resp.descriptiveAnswer)) wrongCount++;
    else unansweredCount++;

    totalScore += resp.marksAwarded || 0;
  }

  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 10000) / 100 : 0;
  const passed = finalScore >= (exam.passingMarks || 0);

  attempt.score = {
    totalScore: finalScore,
    maxScore,
    percentage,
    passed,
    correctAnswersCount: correctCount,
    wrongAnswersCount: wrongCount,
    unansweredCount
  };

  if (!stillHasPending) {
    attempt.status = ATTEMPT_STATUS.EVALUATED;
  }

  return attempt;
};

module.exports = {
  shuffleArray,
  prepareShuffledQuestions,
  evaluateAttempt,
  evaluateDescriptiveResponses
};
