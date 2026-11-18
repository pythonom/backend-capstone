const mongoose = require('mongoose');
const config = require('../src/config/config');
const User = require('../src/models/User');
const AcademicGroup = require('../src/models/AcademicGroup');
const Question = require('../src/models/Question');
const Examination = require('../src/models/Examination');
const ExamAttempt = require('../src/models/ExamAttempt');
const AuditLog = require('../src/models/AuditLog');
const { ROLES, QUESTION_TYPES, DIFFICULTY_LEVELS, EXAM_STATUS, ATTEMPT_STATUS, AUDIT_ACTIONS } = require('../src/utils/constants');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      AcademicGroup.deleteMany({}),
      Question.deleteMany({}),
      Examination.deleteMany({}),
      ExamAttempt.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('Seeding Academic Groups (Sections)...');
    const groupA = await AcademicGroup.create({
      name: 'Computer Science & Engineering - Section A',
      code: 'CSE-2026-A',
      department: 'Computer Science',
      semester: 6,
      academicYear: '2025-2026',
      description: 'B.Tech CSE Batch 2022-2026, Section A'
    });

    const groupB = await AcademicGroup.create({
      name: 'Computer Science & Engineering - Section B',
      code: 'CSE-2026-B',
      department: 'Computer Science',
      semester: 6,
      academicYear: '2025-2026',
      description: 'B.Tech CSE Batch 2022-2026, Section B'
    });

    const groupIT = await AcademicGroup.create({
      name: 'Information Technology - Section A',
      code: 'IT-2026-A',
      department: 'Information Technology',
      semester: 6,
      academicYear: '2025-2026',
      description: 'B.Tech IT Batch 2022-2026, Section A'
    });

    console.log('Seeding Users (Admin, Faculty, Students)...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@examportal.edu',
      password: 'Admin@123',
      role: ROLES.ADMIN
    });

    const facultySharma = await User.create({
      name: 'Prof. Ramesh Sharma',
      email: 'prof.sharma@examportal.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY,
      facultyId: 'FAC-CSE-001'
    });

    const facultyPatel = await User.create({
      name: 'Dr. Priya Patel',
      email: 'dr.patel@examportal.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY,
      facultyId: 'FAC-CSE-002'
    });

    const studentRahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul.verma@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      studentId: '2022CSE014',
      academicGroup: groupA._id
    });

    const studentAnanya = await User.create({
      name: 'Ananya Singh',
      email: 'ananya.singh@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      studentId: '2022CSE028',
      academicGroup: groupA._id
    });

    const studentRohit = await User.create({
      name: 'Rohit Kumar',
      email: 'rohit.kumar@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      studentId: '2022CSE075',
      academicGroup: groupB._id
    });

    const studentPriya = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      studentId: '2022CSE082',
      academicGroup: groupB._id
    });

    const studentAditya = await User.create({
      name: 'Aditya Nair',
      email: 'aditya.nair@student.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      studentId: '2022IT009',
      academicGroup: groupIT._id
    });

    console.log('Seeding Question Bank...');
    const questions = await Question.create([
      {
        title: 'What is the worst-case time complexity of searching in a Balanced Binary Search Tree (AVL Tree)?',
        type: QUESTION_TYPES.MCQ,
        subject: 'Data Structures',
        topic: 'Binary Search Trees',
        difficulty: DIFFICULTY_LEVELS.EASY,
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(log n)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(n log n)' }
        ],
        correctAnswer: 'B',
        explanation: 'AVL trees maintain height balance within factor of 1, guaranteeing O(log n) tree height and search time.',
        createdBy: facultySharma._id
      },
      {
        title: 'Which data structure is primarily used for implementing Breadth-First Search (BFS) graph traversal?',
        type: QUESTION_TYPES.MCQ,
        subject: 'Data Structures',
        topic: 'Graphs',
        difficulty: DIFFICULTY_LEVELS.EASY,
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { id: 'A', text: 'Stack' },
          { id: 'B', text: 'Queue' },
          { id: 'C', text: 'Priority Queue' },
          { id: 'D', text: 'Hash Table' }
        ],
        correctAnswer: 'B',
        explanation: 'BFS explores vertices level by level, utilizing a FIFO Queue.',
        createdBy: facultySharma._id
      },
      {
        title: 'In dynamic programming, what two key properties must an optimization problem exhibit?',
        type: QUESTION_TYPES.MCQ,
        subject: 'Algorithms',
        topic: 'Dynamic Programming',
        difficulty: DIFFICULTY_LEVELS.MEDIUM,
        marks: 3,
        negativeMarks: 1,
        options: [
          { id: 'A', text: 'Optimal substructure and Overlapping subproblems' },
          { id: 'B', text: 'Greedy choice property and Optimal substructure' },
          { id: 'C', text: 'Divide and conquer and Non-overlapping subproblems' },
          { id: 'D', text: 'Recursion and Backtracking' }
        ],
        correctAnswer: 'A',
        explanation: 'DP applies when solutions can be built from optimal solutions of overlapping subproblems.',
        createdBy: facultySharma._id
      },
      {
        title: 'What is the time complexity of building a heap from an unsorted array of n elements using bottom-up Heapify?',
        type: QUESTION_TYPES.MCQ,
        subject: 'Data Structures',
        topic: 'Heaps',
        difficulty: DIFFICULTY_LEVELS.HARD,
        marks: 3,
        negativeMarks: 1,
        options: [
          { id: 'A', text: 'O(n log n)' },
          { id: 'B', text: 'O(n)' },
          { id: 'C', text: 'O(log n)' },
          { id: 'D', text: 'O(n^2)' }
        ],
        correctAnswer: 'B',
        explanation: 'Sum of heights in a binary tree sums to O(n), so Build-Heap is linear time.',
        createdBy: facultySharma._id
      },
      {
        title: 'Which page replacement algorithm suffers from Belady’s Anomaly?',
        type: QUESTION_TYPES.MCQ,
        subject: 'Operating Systems',
        topic: 'Virtual Memory',
        difficulty: DIFFICULTY_LEVELS.MEDIUM,
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { id: 'A', text: 'LRU (Least Recently Used)' },
          { id: 'B', text: 'FIFO (First-In-First-Out)' },
          { id: 'C', text: 'Optimal Page Replacement' },
          { id: 'D', text: 'Clock Page Replacement' }
        ],
        correctAnswer: 'B',
        explanation: 'FIFO can incur more page faults as the number of allocated page frames increases.',
        createdBy: facultyPatel._id
      },
      {
        title: 'Which normal form eliminates partial functional dependencies on candidate keys?',
        type: QUESTION_TYPES.MCQ,
        subject: 'DBMS',
        topic: 'Normalization',
        difficulty: DIFFICULTY_LEVELS.EASY,
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { id: 'A', text: 'First Normal Form (1NF)' },
          { id: 'B', text: 'Second Normal Form (2NF)' },
          { id: 'C', text: 'Third Normal Form (3NF)' },
          { id: 'D', text: 'Boyce-Codd Normal Form (BCNF)' }
        ],
        correctAnswer: 'B',
        explanation: '2NF requires relation to be in 1NF and no non-prime attribute to be partially dependent on candidate key.',
        createdBy: facultyPatel._id
      },
      {
        title: 'Explain the working of Dijkstra’s Shortest Path Algorithm and its limitation regarding negative edge weights.',
        type: QUESTION_TYPES.DESCRIPTIVE,
        subject: 'Algorithms',
        topic: 'Graph Algorithms',
        difficulty: DIFFICULTY_LEVELS.MEDIUM,
        marks: 5,
        negativeMarks: 0,
        options: [],
        correctAnswer: 'Key points: Greedy approach, min-priority queue, relaxation step d[v] = min(d[v], d[u] + w(u,v)). Fails with negative weights because once a vertex is marked visited/extracted, its distance is assumed final.',
        explanation: 'Dijkstra assumes distances are monotonically increasing along path.',
        createdBy: facultySharma._id
      }
    ]);

    console.log('Seeding Examinations...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 3600 * 1000); // started 2 hours ago
    const endTime = new Date(now.getTime() + 24 * 3600 * 1000); // ends tomorrow

    const exam1 = await Examination.create({
      title: 'CS301 - Mid-Term Assessment: Data Structures & Algorithms',
      description: 'Comprehensive mid-semester examination covering Trees, Graphs, DP and Heaps.',
      instructions: '1. All objective questions carry negative marking for incorrect answers.\n2. Do not refresh or exit full-screen.\n3. Descriptive questions will be manually evaluated.',
      course: 'CS301 - Data Structures & Algorithms',
      facultyId: facultySharma._id,
      assignedGroups: [groupA._id, groupB._id],
      assignedStudents: [],
      questions: [
        { questionId: questions[0]._id, marks: 2, negativeMarks: 0.5 },
        { questionId: questions[1]._id, marks: 2, negativeMarks: 0.5 },
        { questionId: questions[2]._id, marks: 3, negativeMarks: 1 },
        { questionId: questions[3]._id, marks: 3, negativeMarks: 1 },
        { questionId: questions[6]._id, marks: 5, negativeMarks: 0 }
      ],
      totalMarks: 15,
      passingMarks: 6,
      durationMinutes: 60,
      startTime,
      endTime,
      status: EXAM_STATUS.PUBLISHED,
      settings: {
        randomizeQuestions: true,
        randomizeOptions: true,
        negativeMarking: true,
        defaultNegativeMarksPerQuestion: 0.5,
        allowRetake: false,
        maxRetakes: 0,
        isResultReleased: true,
        showQuestionReviewToStudent: true
      }
    });

    const exam2 = await Examination.create({
      title: 'CS302 - Operating Systems & DBMS Assessment',
      description: 'Covers Virtual Memory, Paging, and Database Normalization principles.',
      instructions: 'Standard 45-minute objective exam. No negative marking.',
      course: 'CS302 - Systems Engineering',
      facultyId: facultyPatel._id,
      assignedGroups: [groupA._id],
      assignedStudents: [studentAditya._id],
      questions: [
        { questionId: questions[4]._id, marks: 2, negativeMarks: 0 },
        { questionId: questions[5]._id, marks: 2, negativeMarks: 0 }
      ],
      totalMarks: 4,
      passingMarks: 2,
      durationMinutes: 45,
      startTime,
      endTime,
      status: EXAM_STATUS.PUBLISHED,
      settings: {
        randomizeQuestions: false,
        randomizeOptions: true,
        negativeMarking: false,
        isResultReleased: false,
        showQuestionReviewToStudent: false
      }
    });

    console.log('Seeding Exam Attempts and Results...');
    // Rahul Verma attempt for Exam 1 (High Performer)
    const rahulAttempt = await ExamAttempt.create({
      examId: exam1._id,
      studentId: studentRahul._id,
      attemptNumber: 1,
      startTime: new Date(now.getTime() - 90 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 45 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 30 * 60 * 1000),
      status: ATTEMPT_STATUS.EVALUATED,
      shuffledQuestions: [
        { questionId: questions[0]._id, order: 1, options: questions[0].options },
        { questionId: questions[1]._id, order: 2, options: questions[1].options },
        { questionId: questions[2]._id, order: 3, options: questions[2].options },
        { questionId: questions[3]._id, order: 4, options: questions[3].options },
        { questionId: questions[6]._id, order: 5, options: [] }
      ],
      responses: [
        {
          questionId: questions[0]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 2,
          maxMarks: 2,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[1]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 2,
          maxMarks: 2,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[2]._id,
          selectedOption: 'A',
          isCorrect: true,
          marksAwarded: 3,
          maxMarks: 3,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[3]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 3,
          maxMarks: 3,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[6]._id,
          descriptiveAnswer: 'Dijkstra algorithm finds shortest paths from source to all vertices using greedy approach with min-heap. It repeatedly extracts min distance vertex and relaxes outgoing edges. It fails on negative edges because greedily finalized distances can be shortened by later negative cycles/edges.',
          isCorrect: true,
          marksAwarded: 4.5,
          maxMarks: 5,
          negativeMarksApplied: 0,
          evaluatedBy: facultySharma._id,
          facultyFeedback: 'Excellent explanation of min-heap and edge relaxation concept.'
        }
      ],
      score: {
        totalScore: 14.5,
        maxScore: 15,
        percentage: 96.67,
        passed: true,
        correctAnswersCount: 5,
        wrongAnswersCount: 0,
        unansweredCount: 0
      }
    });

    // Ananya Singh attempt for Exam 1 (Average Performer with 1 wrong answer)
    const ananyaAttempt = await ExamAttempt.create({
      examId: exam1._id,
      studentId: studentAnanya._id,
      attemptNumber: 1,
      startTime: new Date(now.getTime() - 80 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 35 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 20 * 60 * 1000),
      status: ATTEMPT_STATUS.EVALUATED,
      shuffledQuestions: [
        { questionId: questions[0]._id, order: 1, options: questions[0].options },
        { questionId: questions[1]._id, order: 2, options: questions[1].options },
        { questionId: questions[2]._id, order: 3, options: questions[2].options },
        { questionId: questions[3]._id, order: 4, options: questions[3].options },
        { questionId: questions[6]._id, order: 5, options: [] }
      ],
      responses: [
        {
          questionId: questions[0]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 2,
          maxMarks: 2,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[1]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 2,
          maxMarks: 2,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[2]._id,
          selectedOption: 'B', // Wrong option -> penalty -1
          isCorrect: false,
          marksAwarded: -1,
          maxMarks: 3,
          negativeMarksApplied: 1
        },
        {
          questionId: questions[3]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 3,
          maxMarks: 3,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[6]._id,
          descriptiveAnswer: 'Dijkstra uses priority queue to pick minimum distance vertex. Negative weights lead to infinite loops or incorrect shortest path calculations.',
          isCorrect: true,
          marksAwarded: 3,
          maxMarks: 5,
          negativeMarksApplied: 0,
          evaluatedBy: facultySharma._id,
          facultyFeedback: 'Good basic explanation, missed relaxation formula.'
        }
      ],
      score: {
        totalScore: 9,
        maxScore: 15,
        percentage: 60.0,
        passed: true,
        correctAnswersCount: 4,
        wrongAnswersCount: 1,
        unansweredCount: 0
      }
    });

    // Priya Sharma attempt from Section B
    const priyaAttempt = await ExamAttempt.create({
      examId: exam1._id,
      studentId: studentPriya._id,
      attemptNumber: 1,
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 15 * 60 * 1000),
      expiresAt: new Date(now.getTime()),
      status: ATTEMPT_STATUS.EVALUATED,
      shuffledQuestions: [
        { questionId: questions[0]._id, order: 1, options: questions[0].options },
        { questionId: questions[1]._id, order: 2, options: questions[1].options },
        { questionId: questions[2]._id, order: 3, options: questions[2].options },
        { questionId: questions[3]._id, order: 4, options: questions[3].options },
        { questionId: questions[6]._id, order: 5, options: [] }
      ],
      responses: [
        {
          questionId: questions[0]._id,
          selectedOption: 'B',
          isCorrect: true,
          marksAwarded: 2,
          maxMarks: 2,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[1]._id,
          selectedOption: 'A', // Wrong -> penalty -0.5
          isCorrect: false,
          marksAwarded: -0.5,
          maxMarks: 2,
          negativeMarksApplied: 0.5
        },
        {
          questionId: questions[2]._id,
          selectedOption: 'A',
          isCorrect: true,
          marksAwarded: 3,
          maxMarks: 3,
          negativeMarksApplied: 0
        },
        {
          questionId: questions[3]._id,
          selectedOption: 'A', // Wrong -> penalty -1
          isCorrect: false,
          marksAwarded: -1,
          maxMarks: 3,
          negativeMarksApplied: 1
        },
        {
          questionId: questions[6]._id,
          descriptiveAnswer: 'Greedy search for lowest cost nodes.',
          isCorrect: true,
          marksAwarded: 1.5,
          maxMarks: 5,
          negativeMarksApplied: 0,
          evaluatedBy: facultySharma._id,
          facultyFeedback: 'Brief answer.'
        }
      ],
      score: {
        totalScore: 5.0,
        maxScore: 15,
        percentage: 33.33,
        passed: false, // failed (< 6 passing marks)
        correctAnswersCount: 2,
        wrongAnswersCount: 2,
        unansweredCount: 0
      }
    });

    console.log('Seeding Audit Logs...');
    await AuditLog.create([
      {
        action: AUDIT_ACTIONS.EXAM_CREATE,
        userId: facultySharma._id,
        userRole: ROLES.FACULTY,
        examId: exam1._id,
        details: { title: exam1.title, totalMarks: exam1.totalMarks },
        ipAddress: '127.0.0.1'
      },
      {
        action: AUDIT_ACTIONS.EXAM_PUBLISH,
        userId: facultySharma._id,
        userRole: ROLES.FACULTY,
        examId: exam1._id,
        details: { title: exam1.title },
        ipAddress: '127.0.0.1'
      },
      {
        action: AUDIT_ACTIONS.ATTEMPT_START,
        userId: studentRahul._id,
        userRole: ROLES.STUDENT,
        examId: exam1._id,
        details: { attemptId: rahulAttempt._id },
        ipAddress: '127.0.0.1'
      },
      {
        action: AUDIT_ACTIONS.ATTEMPT_SUBMIT,
        userId: studentRahul._id,
        userRole: ROLES.STUDENT,
        examId: exam1._id,
        details: { attemptId: rahulAttempt._id, score: 14.5 },
        ipAddress: '127.0.0.1'
      },
      {
        action: AUDIT_ACTIONS.RESULT_RELEASE,
        userId: facultySharma._id,
        userRole: ROLES.FACULTY,
        examId: exam1._id,
        details: { title: exam1.title },
        ipAddress: '127.0.0.1'
      }
    ]);

    console.log('\n======================================================');
    console.log(' DATABASE SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Admin Account:');
    console.log('  Email: admin@examportal.edu');
    console.log('  Password: Admin@123\n');
    console.log('Faculty Accounts:');
    console.log('  Email: prof.sharma@examportal.edu | Pass: Faculty@123');
    console.log('  Email: dr.patel@examportal.edu    | Pass: Faculty@123\n');
    console.log('Student Accounts:');
    console.log('  Email: rahul.verma@student.edu    | Pass: Student@123 (Section A)');
    console.log('  Email: ananya.singh@student.edu   | Pass: Student@123 (Section A)');
    console.log('  Email: rohit.kumar@student.edu    | Pass: Student@123 (Section B)');
    console.log('  Email: priya.sharma@student.edu   | Pass: Student@123 (Section B)');
    console.log('  Email: aditya.nair@student.edu    | Pass: Student@123 (IT Section A)');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
