# Online Examination and Assessment Management System (Full-Stack)

An enterprise-grade, secure, and production-ready full-stack application (Express + MongoDB backend & React + Vite frontend) built for educational institutions to conduct, monitor, and evaluate examinations with strict server-side integrity, automatic objective grading, real-time proctoring with Socket.IO, and deep performance analytics using MongoDB aggregation pipelines.

---

## 🚀 Key Highlights & Architectural Strengths

- **Secure Role-Based Access Control (RBAC):** Distinct roles for `admin`, `faculty`, and `student` guarded with bcrypt hashing and dual JWT access/refresh token rotation.
- **Server-Side Assessment Enforcement:** Examination windows, timers, and submission locks are enforced strictly on the server—client clocks are never trusted.
- **Zero-Leakage Question Sanitization:** Correct answers, answer keys, and grading rubrics are completely stripped from student-facing endpoints during test delivery.
- **Automated Objective Evaluation & Configurable Negative Marking:** Instant server-side grading for Multiple-Choice Questions (MCQ) with configurable penalty deduction and floor capping at 0.
- **Descriptive Question Support:** Faculty can grade long-answer/descriptive questions with custom marks and qualitative feedback.
- **Question & Options Randomization:** Shuffles question order and option choices per student attempt using the Fisher-Yates algorithm.
- **Real-time Live Proctoring Dashboard (Socket.IO):** Authorized faculty receive live socket events whenever students start, submit, or finish attempts; students receive instant notifications on exam scheduling and result release.
- **High-Performance MongoDB Aggregation Pipelines:** Multi-stage aggregation pipelines for comprehensive exam performance statistics, question discrimination/accuracy rates, section-wise comparative metrics, and dynamic student leaderboards.
- **Tamper-Evident Audit Logging:** Detailed audit trail tracking exam creations, updates, attempt events, submissions, and result publication.
- **100% Automated Test Coverage:** Comprehensive test suite written with Jest and Supertest covering all authentication, examination workflow, evaluation, security edge cases, and aggregation pipelines.

---

## 🛠 Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x
- **Database:** MongoDB (Mongoose ODM 8.x)
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`
- **Validation:** `joi`
- **Real-Time Communication:** `socket.io` 4.x
- **Testing:** `jest`, `supertest`
- **Frontend SPA:** React 19, Vite, Lucide Icons, Axios, Socket.IO Client

---

## 📁 Project Architecture & Directory Layout

```
capstone-backend/
├── src/
│   ├── config/
│   │   ├── config.js               # Environment variables and app configuration
│   │   └── db.js                   # Mongoose connection & graceful shutdown
│   ├── models/
│   │   ├── User.js                 # Users (Admin, Faculty, Student)
│   │   ├── AcademicGroup.js        # Sections, Batches, Departments
│   │   ├── Question.js             # Question Bank (MCQ & Descriptive)
│   │   ├── Examination.js          # Exam schedules, assignments, scoring rules
│   │   ├── ExamAttempt.js          # Student attempts, answers, evaluated scores
│   │   ├── RefreshToken.js         # JWT refresh token storage with TTL
│   │   └── AuditLog.js             # System audit logs
│   ├── middleware/
│   │   ├── auth.js                 # JWT authenticate & authorize(roles) RBAC
│   │   ├── validate.js             # Joi request schema validation
│   │   └── errorHandler.js         # Centralized error handler with formatted JSON
│   ├── validations/
│   │   ├── auth.validation.js
│   │   ├── user.validation.js
│   │   ├── group.validation.js
│   │   ├── question.validation.js
│   │   ├── exam.validation.js
│   │   └── attempt.validation.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── group.controller.js
│   │   ├── question.controller.js
│   │   ├── exam.controller.js
│   │   ├── attempt.controller.js
│   │   ├── analytics.controller.js
│   │   └── audit.controller.js
│   ├── services/
│   │   ├── audit.service.js        # Audit trail logger
│   │   ├── socket.service.js       # Real-time WebSocket room & event manager
│   │   ├── evaluation.service.js   # Question shuffling & automatic grading engine
│   │   └── analytics.service.js    # MongoDB aggregation pipelines
│   ├── routes/
│   │   ├── index.routes.js         # Master router mount (/api/v1)
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── group.routes.js
│   │   ├── question.routes.js
│   │   ├── exam.routes.js
│   │   ├── attempt.routes.js
│   │   ├── analytics.routes.js
│   │   └── audit.routes.js
│   ├── utils/
│   │   ├── apiError.js             # Standardized operational error class
│   │   ├── apiResponse.js          # Standardized response wrapper
│   │   ├── constants.js            # Enums (Roles, Difficulty, Status, Actions)
│   │   └── token.util.js           # JWT signing with unique nonces
│   ├── app.js                      # Express application initialization
│   └── server.js                   # HTTP Server + Socket.IO bootstrap
├── scripts/
│   └── seed.js                     # Rich seed script with demo accounts & data
├── tests/
│   ├── setup.js                    # Test database connection & teardown
│   ├── auth.test.js                # Auth & RBAC test suite
│   ├── question.test.js            # Question bank test suite
│   ├── exam.test.js                # Exam creation & access protection tests
│   ├── attempt-and-eval.test.js    # Attempt, auto-eval & negative marking tests
│   └── analytics.test.js           # Aggregation pipelines test suite
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18+ (verified on Node v24)
- **MongoDB**: Local MongoDB community server (listening on default port `27017`) or MongoDB Atlas URI.

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/online_exam_db
JWT_ACCESS_SECRET=exam_secure_access_secret_key_capstone_2026_xyz!@#
JWT_REFRESH_SECRET=exam_secure_refresh_secret_key_capstone_2026_abc$%^
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
Populates the database with realistic demo data (Admin, Faculty, Students, Academic Groups, Question Bank, Scheduled Exams, Evaluated Attempts, and Audit Logs):
```bash
npm run seed
```

#### Demo Credentials Created:
| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@examportal.edu` | `Admin@123` | Full administrative control |
| **Faculty 1** | `prof.sharma@examportal.edu` | `Faculty@123` | Prof. Ramesh Sharma (CSE) |
| **Faculty 2** | `dr.patel@examportal.edu` | `Faculty@123` | Dr. Priya Patel (CSE) |
| **Student 1** | `rahul.verma@student.edu` | `Student@123` | Section A (Top Performer) |
| **Student 2** | `ananya.singh@student.edu` | `Student@123` | Section A |
| **Student 3** | `rohit.kumar@student.edu` | `Student@123` | Section B |
| **Student 4** | `priya.sharma@student.edu` | `Student@123` | Section B |
| **Student 5** | `aditya.nair@student.edu` | `Student@123` | IT Section A |

### 5. Run the Server & Frontend
```bash
# Option A: Run Full-Stack unified server (Express serves API + built React SPA):
npm start
# Visit: http://localhost:5000 in your browser!

# Option B: Run in Development Mode with Hot Reload:
# Terminal 1 (Backend API):
npm run dev
# Terminal 2 (Vite Frontend with HMR):
npm run dev:frontend
# Visit: http://localhost:3000
```

### 6. Run the Automated Tests
```bash
npm test
```
Executes all 5 test suites sequentially against a test database with 100% pass rate.

---

## 🔒 Security & Assessment Integrity Implementation

1. **Answer Key Protection:**
   The `Question.toStudentView()` and examination attempt delivery pipeline completely strip `correctAnswer` and `explanation` from responses sent to students. Only when faculty deliberately calls `/exams/:examId/release-results` with `showQuestionReview: true` can students see answer keys on completed attempts.

2. **Server-Side Timing Enforcement:**
   When a student starts an exam:
   $$\text{expiresAt} = \min(\text{startTime} + \text{durationMinutes}, \text{exam.endTime})$$
   Subsequent submissions verify that current server time does not exceed `expiresAt` (with a small 30-second network latency grace window). Late submissions are locked and marked `expired`.

3. **Untrusted Client Submission:**
   Clients never submit marks or total scores. The client only sends `{ questionId, selectedOption }` or `{ questionId, descriptiveAnswer }`. The backend matches question IDs against the examination schema, verifies correct answers against the database, computes penalties, and calculates total score.

4. **Multi-Attempt / Retake Prevention:**
   If `exam.settings.allowRetake` is `false`, any attempt to call `/exams/:examId/start` after a prior submission returns HTTP `400 Bad Request`. If an attempt is currently `in_progress`, the endpoint resumes the ongoing attempt rather than duplicating it.

---

## 📡 Real-Time Socket.IO Protocol

| Room | Intended Client | Trigger Events | Description |
| :--- | :--- | :--- | :--- |
| `exam:monitoring:<examId>` | Faculty / Proctors | `exam:attempt_started`<br>`exam:attempt_submitted` | Live updates on student attempt status, time elapsed, and completed score. |
| `student:<studentId>` | Student | `exam:evaluated`<br>`exam:results_released` | Direct notification when manual descriptive evaluation is finished or results are released. |
| Global Broadcast | All connected clients | `exam:published` | Informs assigned students when an examination becomes published and available. |

---

## 📊 Performance Analytics Aggregation Pipelines

The system exposes 4 MongoDB aggregation pipelines via `/api/v1/analytics/`:

1. **Exam Overview (`/exams/:examId/overview`):**
   - Uses `$match`, `$group`, and `$project` to calculate total submissions, active attempts count, average score, maximum score, minimum score, and overall passing rate percentage.
2. **Question-Wise Performance (`/exams/:examId/questions`):**
   - Unwinds `$responses`, groups by `questionId`, computes accuracy rate percentage, correct/wrong counts, and sorts questions by difficulty to identify topics where students struggled.
3. **Section-Wise Breakdown (`/exams/:examId/sections`):**
   - Performs `$lookup` on `User` and `AcademicGroup` to compare cross-section averages, highest scores, and pass rates.
4. **Student Leaderboard (`/exams/:examId/leaderboard`):**
   - Sorts attempts by `score.totalScore` descending and `timeTakenSeconds` ascending, then projects dynamic competitive ranks `1, 2, 3...`.

---

## 📚 REST API Reference

All endpoints are prefixed with `/api/v1`.

### 1. Authentication (`/auth`)
- `POST /auth/register` - Register a new user (`admin`, `faculty`, `student`).
- `POST /auth/login` - Authenticate with email/password; returns user info, access token, and refresh token.
- `POST /auth/refresh-token` - Generate a new access token using a valid refresh token.
- `POST /auth/logout` - Invalidate refresh token and log audit entry.
- `GET /auth/me` - Retrieve authenticated user profile.

### 2. User & Section Management (`/users`, `/groups`)
- `POST /groups` - Create academic group / section (*Admin only*).
- `GET /groups` - List academic groups.
- `POST /users` - Create user with role and group assignment (*Admin only*).
- `GET /users` - List users with role filter, search, and pagination (*Admin & Faculty*).
- `PATCH /users/:userId` - Update user details (*Admin only*).
- `DELETE /users/:userId` - Deactivate user (*Admin only*).

### 3. Question Bank (`/questions`)
- `POST /questions` - Create MCQ or Descriptive question with options, marks, negative marks, difficulty, and correct answer (*Faculty & Admin*).
- `GET /questions` - Search and filter questions by subject, topic, difficulty, and type with pagination (*Faculty & Admin*).
- `GET /questions/:questionId` - Get question details (*Faculty & Admin*).
- `PATCH /questions/:questionId` - Update question in bank (*Faculty & Admin*).
- `DELETE /questions/:questionId` - Delete question (*Faculty & Admin*).

### 4. Examination Management (`/exams`)
- `POST /exams` - Create examination with duration, start/end time, question set, assigned groups/students, and randomization settings (*Faculty & Admin*).
- `GET /exams` - List exams (Students receive assigned published exams; Faculty receive created exams).
- `GET /exams/:examId` - Get exam details (Students receive sanitized preview; Faculty receive full configuration).
- `PATCH /exams/:examId` - Edit exam details prior to submissions (*Faculty & Admin*).
- `POST /exams/:examId/publish` - Publish exam and broadcast live notification (*Faculty & Admin*).
- `POST /exams/:examId/release-results` - Release results and optionally answer review to students (*Faculty & Admin*).
- `DELETE /exams/:examId` - Delete draft exam (*Faculty & Admin*).

### 5. Examination Attempt & Evaluation (`/attempts`)
- `POST /attempts/exams/:examId/start` - Start or resume examination attempt; returns randomized, sanitized questions (*Student only*).
- `POST /attempts/:attemptId/save-answer` - Auto-save intermediate response for a question (*Student only*).
- `POST /attempts/:attemptId/submit` - Submit final responses; triggers automatic objective grading and negative marking (*Student only*).
- `POST /attempts/:attemptId/evaluate-descriptive` - Grade descriptive answers with marks and feedback (*Faculty & Admin*).
- `GET /attempts/:attemptId/result` - View score and answers (protected by faculty release setting for students).
- `GET /attempts/exams/:examId/attempts` - List all student attempts for an exam (*Faculty & Admin*).

### 6. Analytics (`/analytics`)
- `GET /analytics/exams/:examId/overview` - Statistical overview and pass rates (*Faculty & Admin*).
- `GET /analytics/exams/:examId/questions` - Question-level accuracy breakdown (*Faculty & Admin*).
- `GET /analytics/exams/:examId/sections` - Cross-section performance comparison (*Faculty & Admin*).
- `GET /analytics/exams/:examId/leaderboard` - Ranked student leaderboard (*Faculty & Admin*).

### 7. Audit Logs (`/audit-logs`)
- `GET /audit-logs` - Inspect system audit logs with filters on action, user, and exam (*Admin only*).
