import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  FileText,
  Award,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export const StudentPortal = ({ onStartExam, onViewResults }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExamInfo, setSelectedExamInfo] = useState(null);

  const fetchAssignedExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams');
      setExams(res.data.data.exams || []);
    } catch (err) {
      setError('Failed to fetch assigned examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Assessment Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            View your assigned exams, launch timed sessions, and inspect released results.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchAssignedExams}>
          Refresh List
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            marginBottom: 20
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading your assigned examinations...
        </div>
      ) : exams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Examinations Assigned</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            You have no upcoming or active examinations assigned to your section at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {exams.map((exam) => {
            const hasSubmitted =
              exam.userAttempt &&
              ['submitted', 'evaluated'].includes(exam.userAttempt.status);
            const isInProgress =
              exam.userAttempt && exam.userAttempt.status === 'in_progress';
            const isResultReleased = exam.settings?.isResultReleased;

            return (
              <div
                key={exam._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: exam.isActive ? '4px solid var(--primary)' : '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className="badge badge-primary">{exam.course}</span>

                    {hasSubmitted ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309' }}>
                        In Progress
                      </span>
                    ) : exam.isActive ? (
                      <span className="badge badge-success">Active Now</span>
                    ) : exam.isUpcoming ? (
                      <span className="badge badge-neutral">Upcoming</span>
                    ) : (
                      <span className="badge badge-danger">Closed</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                    {exam.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      marginBottom: 16,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {exam.description || 'No additional description provided.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} style={{ color: 'var(--primary)' }} />
                      <span><strong>Duration:</strong> {exam.durationMinutes} Minutes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} style={{ color: 'var(--secondary)' }} />
                      <span><strong>Window:</strong> {formatDate(exam.startTime)} – {formatDate(exam.endTime)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={14} style={{ color: '#f59e0b' }} />
                      <span>
                        <strong>Total Marks:</strong> {exam.totalMarks} | <strong>Pass:</strong> {exam.passingMarks}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  {hasSubmitted ? (
                    <div>
                      {isResultReleased ? (
                        <button
                          className="btn btn-outline"
                          style={{ width: '100%', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                          onClick={() => onViewResults(exam.userAttempt._id)}
                        >
                          <Award size={15} />
                          View Released Results
                        </button>
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            background: '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: 8
                          }}
                        >
                          Submitted. Results pending instructor release.
                        </div>
                      )}
                    </div>
                  ) : isInProgress ? (
                    <button
                      className="btn btn-warning"
                      style={{ width: '100%', background: '#f59e0b', color: 'white' }}
                      onClick={() => onStartExam(exam._id)}
                    >
                      <PlayCircle size={16} />
                      Resume Active Exam
                    </button>
                  ) : exam.isActive ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => onStartExam(exam._id)}
                    >
                      <PlayCircle size={16} />
                      Start Examination
                    </button>
                  ) : exam.isUpcoming ? (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      Available at {formatDate(exam.startTime)}
                    </button>
                  ) : (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      Examination Closed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
