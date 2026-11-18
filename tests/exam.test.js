require('./setup');
const request = require('supertest');
const app = require('../src/app');
const { ROLES, QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../src/utils/constants');

describe('Examination Management & Scheduling Module', () => {
  let facultyToken;
  let assignedStudentToken;
  let unassignedStudentToken;
  let assignedStudentId;
  let unassignedStudentId;
  let questionId;

  beforeEach(async () => {
    // Register Faculty
    const facRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Faculty User',
      email: 'faculty@exam.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY
    });
    facultyToken = facRes.body.data.tokens.accessToken;

    // Register Assigned Student
    const stu1Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Assigned Student',
      email: 'assigned@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT
    });
    assignedStudentToken = stu1Res.body.data.tokens.accessToken;
    assignedStudentId = stu1Res.body.data.user._id;

    // Register Unassigned Student
    const stu2Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Unassigned Student',
      email: 'unassigned@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT
    });
    unassignedStudentToken = stu2Res.body.data.tokens.accessToken;
    unassignedStudentId = stu2Res.body.data.user._id;

    // Create a question
    const qRes = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Exam Question 1',
        type: QUESTION_TYPES.MCQ,
        subject: 'Algorithms',
        topic: 'Graph',
        difficulty: DIFFICULTY_LEVELS.EASY,
        marks: 5,
        options: [{ id: 'A', text: 'Option 1' }, { id: 'B', text: 'Option 2' }],
        correctAnswer: 'A'
      });
    questionId = qRes.body.data._id;
  });

  it('should allow faculty to create and schedule an examination', async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Midterm Examination',
        course: 'CS101',
        durationMinutes: 60,
        startTime,
        endTime,
        assignedStudents: [assignedStudentId],
        questions: [{ questionId, marks: 5 }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMarks).toBe(5);
    expect(res.body.data.status).toBe('draft');
  });

  it('should allow faculty to publish exam and verify assignment security', async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

    const createRes = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Published Exam',
        course: 'CS101',
        durationMinutes: 60,
        startTime,
        endTime,
        assignedStudents: [assignedStudentId],
        questions: [{ questionId, marks: 5 }]
      });

    const examId = createRes.body.data._id;

    // Publish exam
    const pubRes = await request(app)
      .post(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(pubRes.statusCode).toBe(200);
    expect(pubRes.body.data.status).toBe('published');

    // Assigned student CAN access exam details
    const assignedRes = await request(app)
      .get(`/api/v1/exams/${examId}`)
      .set('Authorization', `Bearer ${assignedStudentToken}`);

    expect(assignedRes.statusCode).toBe(200);
    expect(assignedRes.body.data.title).toBe('Published Exam');
    // Questions array must NOT leak answer keys or full question data before attempt!
    expect(assignedRes.body.data.questions).toBeUndefined();

    // Unassigned student CANNOT access exam (403 Forbidden)
    const unassignedRes = await request(app)
      .get(`/api/v1/exams/${examId}`)
      .set('Authorization', `Bearer ${unassignedStudentToken}`);

    expect(unassignedRes.statusCode).toBe(403);
    expect(unassignedRes.body.message).toContain('not assigned or authorized');
  });
});
