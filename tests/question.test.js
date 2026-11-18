require('./setup');
const request = require('supertest');
const app = require('../src/app');
const { ROLES, QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../src/utils/constants');

describe('Question Bank Module', () => {
  let facultyToken;
  let studentToken;

  beforeEach(async () => {
    // Register Faculty
    const facRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Faculty User',
      email: 'faculty@exam.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY
    });
    facultyToken = facRes.body.data.tokens.accessToken;

    // Register Student
    const stuRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Student User',
      email: 'student@exam.edu',
      password: 'Student@123',
      role: ROLES.STUDENT
    });
    studentToken = stuRes.body.data.tokens.accessToken;
  });

  it('should allow faculty to create an MCQ question with valid options and answer', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'What is the time complexity of QuickSort in average case?',
        type: QUESTION_TYPES.MCQ,
        subject: 'Algorithms',
        topic: 'Sorting',
        difficulty: DIFFICULTY_LEVELS.MEDIUM,
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { id: 'A', text: 'O(n)' },
          { id: 'B', text: 'O(n log n)' },
          { id: 'C', text: 'O(n^2)' },
          { id: 'D', text: 'O(log n)' }
        ],
        correctAnswer: 'B',
        explanation: 'Average case recurrence gives O(n log n).'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('QuickSort');
    expect(res.body.data.correctAnswer).toBe('B');
  });

  it('should reject MCQ creation if correctAnswer does not match any option ID', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Sample Question',
        type: QUESTION_TYPES.MCQ,
        subject: 'Algorithms',
        topic: 'Sorting',
        difficulty: DIFFICULTY_LEVELS.EASY,
        marks: 1,
        options: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' }
        ],
        correctAnswer: 'Z' // Non-existent option
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('does not match any provided option ID');
  });

  it('should FORBID students from creating questions (Role-Based Access Control)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Question',
        type: QUESTION_TYPES.MCQ,
        subject: 'Math',
        topic: 'Algebra',
        marks: 1,
        options: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }],
        correctAnswer: 'A'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Access forbidden');
  });

  it('should filter questions by topic and difficulty with pagination', async () => {
    // Create 3 questions
    await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Q1',
      type: QUESTION_TYPES.MCQ,
      subject: 'Data Structures',
      topic: 'Trees',
      difficulty: DIFFICULTY_LEVELS.EASY,
      marks: 1,
      options: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }],
      correctAnswer: 'A'
    });

    await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Q2',
      type: QUESTION_TYPES.MCQ,
      subject: 'Data Structures',
      topic: 'Trees',
      difficulty: DIFFICULTY_LEVELS.HARD,
      marks: 3,
      options: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }],
      correctAnswer: 'B'
    });

    await request(app).post('/api/v1/questions').set('Authorization', `Bearer ${facultyToken}`).send({
      title: 'Q3',
      type: QUESTION_TYPES.MCQ,
      subject: 'Data Structures',
      topic: 'Graphs',
      difficulty: DIFFICULTY_LEVELS.EASY,
      marks: 2,
      options: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }],
      correctAnswer: 'A'
    });

    // Query for topic=Trees and difficulty=EASY
    const res = await request(app)
      .get('/api/v1/questions?topic=Trees&difficulty=easy')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.questions.length).toBe(1);
    expect(res.body.data.questions[0].title).toBe('Q1');
  });
});
