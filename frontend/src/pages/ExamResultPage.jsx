import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  BookOpen,
  MessageSquare
} from 'lucide-react';

export const ExamResultPage = ({ attemptId, onBack }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attempts/${attemptId}/result`);
        setResult(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch examination results');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        Loading examination results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 550, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <Award size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Results Unavailable</h3>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const score = result?.score || {};
  const passed = score.passed;
  const percentage = score.percentage || 0;
  const responses = result?.responses || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <button className="btn btn-outline btn-sm" style={{ marginBottom: 20 }} onClick={onBack}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      {/* Main Score Hero Card */}
      <div
        className="card"
        style={{
          background: passed
            ? 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
          borderLeft: `6px solid ${passed ? '#10b981' : '#ef4444'}`,
          marginBottom: 32,
          padding: 36
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem' }}>
                {passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Attempt #{result?.attemptNumber || 1} • {result?.status?.toUpperCase()}
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Examination Results
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Submitted on {new Date(result?.submittedAt).toLocaleString()}
            </p>
          </div>

          {/* Big Score Counter */}
          <div
            style={{
              textAlign: 'center',
              background: '#ffffff',
              padding: '20px 32px',
              borderRadius: 16,
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: passed ? '#059669' : '#dc2626' }}>
              {score.totalScore} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ {score.maxScore}</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>
              {percentage}% Score
            </div>
          </div>
        </div>

        {/* Detailed Metrics Pill Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            marginTop: 28,
            borderTop: '1px solid var(--border)',
            paddingTop: 20
          }}
        >
          <div style={{ background: '#ffffff', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{score.correctAnswersCount || 0}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CORRECT</div>
          </div>
          <div style={{ background: '#ffffff', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{score.wrongAnswersCount || 0}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>INCORRECT</div>
          </div>
          <div style={{ background: '#ffffff', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}>{score.unansweredCount || 0}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>UNANSWERED</div>
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      {responses.length > 0 ? (
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 16 }}>
            Question-by-Question Review
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {responses.map((resp, idx) => {
              const isCorrect = resp.isCorrect;
              const isDescriptive = resp.type === 'descriptive';

              return (
                <div
                  key={resp.questionId || idx}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${
                      isCorrect === true ? '#10b981' : isCorrect === false ? '#ef4444' : '#f59e0b'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-primary">Q{idx + 1}</span>
                      <span className="badge badge-neutral">{resp.type?.toUpperCase()}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCorrect === true ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={13} /> Correct (+{resp.marksAwarded} Marks)
                        </span>
                      ) : isCorrect === false ? (
                        <span className="badge badge-danger">
                          <XCircle size={13} /> Incorrect ({resp.marksAwarded} Marks)
                        </span>
                      ) : (
                        <span className="badge badge-warning">Pending Evaluation</span>
                      )}
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>
                    {resp.title}
                  </h4>

                  {/* MCQ Review */}
                  {!isDescriptive && resp.options && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                        Your Choice:
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: isCorrect ? '#ecfdf5' : '#fef2f2',
                          border: `1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`,
                          fontWeight: 600,
                          fontSize: '0.88rem'
                        }}
                      >
                        Option {resp.selectedOption || 'None (Unanswered)'}
                      </div>

                      {resp.correctAnswer && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                            Correct Answer: Option {resp.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Descriptive Review */}
                  {isDescriptive && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                        Submitted Answer:
                      </div>
                      <div
                        style={{
                          padding: 12,
                          background: '#f8fafc',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: '0.88rem'
                        }}
                      >
                        {resp.descriptiveAnswer || 'No answer submitted.'}
                      </div>

                      {resp.facultyFeedback && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: '10px 14px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: 8,
                            fontSize: '0.85rem',
                            display: 'flex',
                            gap: 8,
                            color: '#1e40af'
                          }}
                        >
                          <MessageSquare size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>Faculty Feedback:</strong> {resp.facultyFeedback}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {resp.explanation && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <strong>Explanation:</strong> {resp.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Question-by-question review has not been published for this examination.
          </p>
        </div>
      )}
    </div>
  );
};
