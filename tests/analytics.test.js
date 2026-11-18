require('./setup');
const request = require('supertest');
const app = require('../src/app');
const AcademicGroup = require('../src/models/AcademicGroup');
const { ROLES, QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../src/utils/constants');

describe('Aggregation Analytics Module', () => {
  let facultyToken;
  let examId;

  beforeEach(async () => {
    // 1. Create Academic Groups (Sections)
    const groupA = await AcademicGroup.create({
      name: 'CSE Section A',
      code: 'CSE-A',
      department: 'CSE',
      semester: 6,
      academicYear: '2025-2026'
    });

    const groupB = await AcademicGroup.create({
      name: 'CSE Section B',
      code: 'CSE-B',
      department: 'CSE',
      semester: 6,
      academicYear: '2025-2026'
    });

    // 2. Create Faculty
    const facRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Prof. Analytics',
      email: 'analytics.prof@exam.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY
    });
    facultyToken = facRes.body.data.tokens.accessToken;

    // 3. Create 2 Students in Section A and 1 in Section B
    const s1Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice (Sec A)',
      email: 'alice@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      academicGroup: groupA._id
    });
    const s1Token = s1Res.body.data.tokens.accessToken;

    const s2Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob (Sec A)',
      email: 'bob@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      academicGroup: groupA._id
    });
    const s2Token = s2Res.body.data.tokens.accessToken;

    const s3Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie (Sec B)',
      email: 'charlie@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      academicGroup: groupB._id
    });
    const s3Token = s3Res.body.data.tokens.accessToken;

    // 4. Create 2 MCQ Questions
    const q1Res = await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Q1: Easy Question',
      type: QUESTION_TYPES.MCQ,
      subject: 'Data Structures',
      topic: 'Arrays',
      difficulty: DIFFICULTY_LEVELS.EASY,
      marks: 10,
      options: [{ id: 'A', text: 'Option A' }, { id: 'B', text: 'Option B' }],
      correctAnswer: 'A'
    });
    const q1Id = q1Res.body.data._id;

    const q2Res = await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Q2: Tricky Question',
      type: QUESTION_TYPES.MCQ,
      subject: 'Data Structures',
      topic: 'Trees',
      difficulty: DIFFICULTY_LEVELS.HARD,
      marks: 10,
      options: [{ id: 'A', text: 'Option A' }, { id: 'B', text: 'Option B' }],
      correctAnswer: 'B'
    });
    const q2Id = q2Res.body.data._id;

    // 5. Create & Publish Exam
    const now = new Date();
    const examRes = await request(app).post('/api/v1/exams').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Analytics Test Exam',
      course: 'CS301',
      durationMinutes: 45,
      startTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      assignedGroups: [groupA._id, groupB._id],
      questions: [
        { questionId: q1Id, marks: 10 },
        { questionId: q2Id, marks: 10 }
      ],
      totalMarks: 20,
      passingMarks: 10,
      settings: {
        isResultReleased: true
      }
    });
    examId = examRes.body.data._id;

    await request(app).post(`/api/v1/exams/${examId}/publish`).set('Authorization', `Bearer ${facultyToken}`);

    // Student 1 (Alice): Answers both correct (20 marks)
    const att1 = await request(app).post(`/api/v1/attempts/exams/${examId}/start`).set('Authorization', `Bearer ${s1Token}`);
    await request(app).post(`/api/v1/attempts/${att1.body.data.attemptId}/submit`).set('Authorization', `Bearer ${s1Token}`).send({
      responses: [
        { questionId: q1Id, selectedOption: 'A' },
        { questionId: q2Id, selectedOption: 'B' }
      ]
    });

    // Student 2 (Bob): Answers Q1 correct, Q2 wrong (10 marks)
    const att2 = await request(app).post(`/api/v1/attempts/exams/${examId}/start`).set('Authorization', `Bearer ${s2Token}`);
    await request(app).post(`/api/v1/attempts/${att2.body.data.attemptId}/submit`).set('Authorization', `Bearer ${s2Token}`).send({
      responses: [
        { questionId: q1Id, selectedOption: 'A' },
        { questionId: q2Id, selectedOption: 'A' }
      ]
    });

    // Student 3 (Charlie): Answers both wrong (0 marks)
    const att3 = await request(app).post(`/api/v1/attempts/exams/${examId}/start`).set('Authorization', `Bearer ${s3Token}`);
    await request(app).post(`/api/v1/attempts/${att3.body.data.attemptId}/submit`).set('Authorization', `Bearer ${s3Token}`).send({
      responses: [
        { questionId: q1Id, selectedOption: 'B' },
        { questionId: q2Id, selectedOption: 'A' }
      ]
    });
  });

  it('should generate exam overview with average, highest, lowest, and pass rate', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/exams/${examId}/overview`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.totalSubmissions).toBe(3);
    expect(data.highestScore).toBe(20);
    expect(data.lowestScore).toBe(0);
    expect(data.averageScore).toBe(10); // (20 + 10 + 0) / 3 = 10
    expect(data.passedCount).toBe(2); // Alice & Bob passed
    expect(data.failedCount).toBe(1); // Charlie failed
    expect(data.passRatePercentage).toBe(66.67);
  });

  it('should generate question-wise accuracy analytics using aggregation', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/exams/${examId}/questions`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const questions = res.body.data;
    expect(questions.length).toBe(2);

    // Q1 was answered correctly by Alice & Bob (2 out of 3 = 66.67%)
    const q1Stat = questions.find((q) => q.title.includes('Q1'));
    expect(q1Stat.totalAttempts).toBe(3);
    expect(q1Stat.correctCount).toBe(2);

    // Q2 was answered correctly only by Alice (1 out of 3 = 33.33%)
    const q2Stat = questions.find((q) => q.title.includes('Q2'));
    expect(q2Stat.totalAttempts).toBe(3);
    expect(q2Stat.correctCount).toBe(1);
    expect(q2Stat.accuracyRatePercentage).toBe(33.33);
  });

  it('should generate section-wise performance aggregation', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/exams/${examId}/sections`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const sections = res.body.data;
    expect(sections.length).toBe(2);

    const secA = sections.find((s) => s.groupCode === 'CSE-A');
    expect(secA.totalSubmissions).toBe(2);
    expect(secA.averageScore).toBe(15); // (20 + 10) / 2 = 15
    expect(secA.passedCount).toBe(2);
    expect(secA.passRatePercentage).toBe(100);

    const secB = sections.find((s) => s.groupCode === 'CSE-B');
    expect(secB.totalSubmissions).toBe(1);
    expect(secB.averageScore).toBe(0);
    expect(secB.passedCount).toBe(0);
  });

  it('should generate student leaderboard with accurate ranks', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/exams/${examId}/leaderboard`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const leaderboard = res.body.data;
    expect(leaderboard.length).toBe(3);

    // Rank 1: Alice (20 marks)
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].studentName).toBe('Alice (Sec A)');
    expect(leaderboard[0].totalScore).toBe(20);

    // Rank 2: Bob (10 marks)
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[1].studentName).toBe('Bob (Sec A)');
    expect(leaderboard[1].totalScore).toBe(10);

    // Rank 3: Charlie (0 marks)
    expect(leaderboard[2].rank).toBe(3);
    expect(leaderboard[2].studentName).toBe('Charlie (Sec B)');
    expect(leaderboard[2].totalScore).toBe(0);
  });
});
