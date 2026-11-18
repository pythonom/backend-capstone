import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';
import { AuthPage } from './pages/AuthPage';
import { StudentPortal } from './pages/StudentPortal';
import { FacultyPortal } from './pages/FacultyPortal';
import { AdminPortal } from './pages/AdminPortal';
import { ExamAttemptPage } from './pages/ExamAttemptPage';
import { ExamResultPage } from './pages/ExamResultPage';

const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeExamId, setActiveExamId] = useState(null);
  const [viewResultAttemptId, setViewResultAttemptId] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)'
        }}
      >
        Initializing Exam Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Active examination in-progress view
  if (activeExamId) {
    return (
      <div className="app-container">
        <NotificationToast />
        <main className="main-content" style={{ maxWidth: 1200 }}>
          <ExamAttemptPage
            examId={activeExamId}
            onComplete={(attemptId) => {
              setActiveExamId(null);
              setViewResultAttemptId(attemptId);
            }}
            onExit={() => setActiveExamId(null)}
          />
        </main>
      </div>
    );
  }

  // View specific attempt results
  if (viewResultAttemptId) {
    return (
      <div className="app-container">
        <Navbar currentView="result" setCurrentView={() => setViewResultAttemptId(null)} />
        <NotificationToast />
        <main className="main-content">
          <ExamResultPage
            attemptId={viewResultAttemptId}
            onBack={() => setViewResultAttemptId(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar currentView="dashboard" setCurrentView={() => {}} />
      <NotificationToast />
      <main className="main-content">
        {user?.role === 'admin' && <AdminPortal />}
        {user?.role === 'faculty' && <FacultyPortal />}
        {user?.role === 'student' && (
          <StudentPortal
            onStartExam={(examId) => setActiveExamId(examId)}
            onViewResults={(attemptId) => setViewResultAttemptId(attemptId)}
          />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
