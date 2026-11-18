require('./setup');
const request = require('supertest');
const app = require('../src/app');
const { ROLES, QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../src/utils/constants');

describe('Examination Attempt, Submission & Auto-Evaluation Module', () => {
  let facultyToken;
  let studentToken;
  let studentId;
  let examId;
  let mcq1Id;
  let mcq2Id;
  let descId;

  beforeEach(async () => {
    // 1. Create Faculty
    const facRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Dr. Faculty',
      email: 'dr.faculty@exam.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY
    });
    facultyToken = facRes.body.data.tokens.accessToken;

    // 2. Create Student
    const stuRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Exam Student',
      email: 'exam.student@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT
    });
    studentToken = stuRes.body.data.tokens.accessToken;
    studentId = stuRes.body.data.user._id;

    // 3. Create MCQ 1 (correct answer: 'A', marks: 2, negativeMarks: 0.5)
    const q1Res = await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'MCQ Question 1',
      type: QUESTION_TYPES.MCQ,
      subject: 'Computer Science',
      topic: 'Networks',
      difficulty: DIFFICULTY_LEVELS.EASY,
      marks: 2,
      negativeMarks: 0.5,
      options: [{ id: 'A', text: 'Correct Opt' }, { id: 'B', text: 'Wrong Opt' }],
      correctAnswer: 'A',
      explanation: 'Explanation for Q1'
    });
    mcq1Id = q1Res.body.data._id;

    // 4. Create MCQ 2 (correct answer: 'B', marks: 3, negativeMarks: 1.0)
    const q2Res = await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'MCQ Question 2',
      type: QUESTION_TYPES.MCQ,
      subject: 'Computer Science',
      topic: 'Networks',
      difficulty: DIFFICULTY_LEVELS.MEDIUM,
      marks: 3,
      negativeMarks: 1.0,
      options: [{ id: 'A', text: 'Wrong Opt' }, { id: 'B', text: 'Correct Opt' }],
      correctAnswer: 'B',
      explanation: 'Explanation for Q2'
    });
    mcq2Id = q2Res.body.data._id;

    // 5. Create Descriptive Question (marks: 5)
    const q3Res = await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Descriptive Question 3',
      type: QUESTION_TYPES.DESCRIPTIVE,
      subject: 'Computer Science',
      topic: 'Networks',
      difficulty: DIFFICULTY_LEVELS.HARD,
      marks: 5,
      options: [],
      correctAnswer: 'Sample key rubric',
      explanation: 'Descriptive rubric'
    });
    descId = q3Res.body.data._id;

    // 6. Create & Publish Exam
    const now = new Date();
    const examRes = await request(app).post('/api/v1/exams').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Auto Eval Test Exam',
      course: 'CS200',
      durationMinutes: 30,
      startTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      assignedStudents: [studentId],
      questions: [
        { questionId: mcq1Id, marks: 2, negativeMarks: 0.5 },
        { questionId: mcq2Id, marks: 3, negativeMarks: 1.0 },
        { questionId: descId, marks: 5, negativeMarks: 0 }
      ],
      totalMarks: 10,
      passingMarks: 4,
      settings: {
        randomizeQuestions: false,
        randomizeOptions: false,
        negativeMarking: true,
        allowRetake: false,
        isResultReleased: false,
        showQuestionReviewToStudent: false
      }
    });
    examId = examRes.body.data._id;

    await request(app).post(`/api/v1/exams/${examId}/publish`).set('Authorization', `Bearer ${facultyToken}`);
  });

  it('should start attempt and sanitize questions (never leak correctAnswer or explanation)', async () => {
    const res = await request(app)
      .post(`/api/v1/attempts/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attemptId).toBeDefined();
    expect(res.body.data.questions.length).toBe(3);

    // CRITICAL SECURITY CHECK: Check that correctAnswer and explanation are stripped
    for (const q of res.body.data.questions) {
      expect(q.correctAnswer).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    }
  });

  it('should save intermediate answers during attempt', async () => {
    const startRes = await request(app)
      .post(`/api/v1/attempts/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.attemptId;

    const saveRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/save-answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: mcq1Id,
        selectedOption: 'A'
      });

    expect(saveRes.statusCode).toBe(200);
    expect(saveRes.body.success).toBe(true);
  });

  it('should automatically evaluate objective questions and apply negative marking correctly', async () => {
    const startRes = await request(app)
      .post(`/api/v1/attempts/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.attemptId;

    // Submit:
    // MCQ 1: 'A' (Correct! -> +2 marks)
    // MCQ 2: 'A' (Wrong! Correct is 'B' -> -1 negative mark penalty)
    // Descriptive: student writes an answer -> pending faculty review
    // Total objective score = 2 - 1 = 1 mark
    const submitRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        responses: [
          { questionId: mcq1Id, selectedOption: 'A' },
          { questionId: mcq2Id, selectedOption: 'A' },
          { questionId: descId, descriptiveAnswer: 'TCP provides reliable ordered transmission.' }
        ]
      });

    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body.success).toBe(true);
    // Since result is not released yet, score is hidden from student in response
    expect(submitRes.body.data.status).toBe('submitted');

    // Faculty checks attempt results
    const facAttemptRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(facAttemptRes.statusCode).toBe(200);
    const score = facAttemptRes.body.data.score;
    expect(score.totalScore).toBe(1); // 2 - 1 = 1
    expect(score.correctAnswersCount).toBe(1);
    expect(score.wrongAnswersCount).toBe(1);
  });

  it('should prevent student from submitting examination more than once when retakes are disabled', async () => {
    const startRes = await request(app)
      .post(`/api/v1/attempts/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ responses: [{ questionId: mcq1Id, selectedOption: 'A' }] });

    // Attempting to start again
    const retakeRes = await request(app)
      .post(`/api/v1/attempts/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(retakeRes.statusCode).toBe(400);
    expect(retakeRes.body.message).toContain('already submitted this examination');
  });

  it('should allow faculty to evaluate descriptive questions and release results', async () => {
    const startRes = await request(app)
      .post(`/api/v1/attempts/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.attemptId;

    await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        responses: [
          { questionId: mcq1Id, selectedOption: 'A' },
          { questionId: descId, descriptiveAnswer: 'Detailed architectural overview of TCP/IP stack.' }
        ]
      });

    // Faculty evaluates descriptive question: awards 4.5 marks out of 5
    const evalRes = await request(app)
      .post(`/api/v1/attempts/${attemptId}/evaluate-descriptive`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        evaluations: [
          {
            questionId: descId,
            marksAwarded: 4.5,
            feedback: 'Very thorough explanation.'
          }
        ]
      });

    expect(evalRes.statusCode).toBe(200);
    expect(evalRes.body.data.status).toBe('evaluated');
    expect(evalRes.body.data.score.totalScore).toBe(6.5); // 2 (MCQ1) + 4.5 (Descriptive) = 6.5
    expect(evalRes.body.data.score.passed).toBe(true);

    // Student tries to view results before release -> FORBIDDEN (403)
    const earlyRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(earlyRes.statusCode).toBe(403);
    expect(earlyRes.body.message).toContain('not yet been released');

    // Faculty releases results
    await request(app)
      .post(`/api/v1/exams/${examId}/release-results`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ showQuestionReview: true });

    // Student views released results
    const releasedRes = await request(app)
      .get(`/api/v1/attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(releasedRes.statusCode).toBe(200);
    expect(releasedRes.body.data.score.totalScore).toBe(6.5);
    expect(releasedRes.body.data.score.passed).toBe(true);
  });
});
