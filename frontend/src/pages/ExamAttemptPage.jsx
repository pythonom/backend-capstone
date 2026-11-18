import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  HelpCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const ExamAttemptPage = ({ examId, onComplete, onExit }) => {
  const [attemptData, setAttemptData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // { [questionId]: { selectedOption, descriptiveAnswer } }
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef(null);

  // Initialize or resume attempt
  useEffect(() => {
    const startOrResume = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post(`/attempts/exams/${examId}/start`);
        const data = res.data.data;
        setAttemptData(data);
        setSecondsRemaining(data.timeRemainingSeconds || 0);

        // Populate any saved responses if resuming
        if (data.savedResponses && Array.isArray(data.savedResponses)) {
          const respMap = {};
          data.savedResponses.forEach((r) => {
            respMap[r.questionId] = {
              selectedOption: r.selectedOption || null,
              descriptiveAnswer: r.descriptiveAnswer || ''
            };
          });
          setResponses(respMap);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initiate examination attempt');
      } finally {
        setLoading(false);
      }
    };

    startOrResume();
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [secondsRemaining > 0]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = async (questionId, optionId) => {
    const updated = {
      ...responses,
      [questionId]: {
        ...responses[questionId],
        selectedOption: optionId
      }
    };
    setResponses(updated);
    await autoSaveAnswer(questionId, optionId, responses[questionId]?.descriptiveAnswer || '');
  };

  const handleDescriptiveChange = (questionId, text) => {
    setResponses({
      ...responses,
      [questionId]: {
        ...responses[questionId],
        descriptiveAnswer: text
      }
    });
  };

  const handleDescriptiveBlur = async (questionId) => {
    const current = responses[questionId];
    if (current?.descriptiveAnswer !== undefined) {
      await autoSaveAnswer(questionId, current?.selectedOption || null, current.descriptiveAnswer);
    }
  };

  const autoSaveAnswer = async (questionId, selectedOption, descriptiveAnswer) => {
    if (!attemptData?.attemptId) return;
    setSaving(true);
    try {
      await api.post(`/attempts/${attemptData.attemptId}/save-answer`, {
        questionId,
        selectedOption,
        descriptiveAnswer
      });
      setLastSavedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      const formattedResponses = Object.entries(responses).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val.selectedOption,
        descriptiveAnswer: val.descriptiveAnswer
      }));

      const res = await api.post(`/attempts/${attemptData.attemptId}/submit`, {
        responses: formattedResponses
      });

      onComplete(attemptData.attemptId, res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
      setIsSubmitModalOpen(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <Clock size={36} className="pulse-anim" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
        <h2>Launching Secure Examination Environment...</h2>
        <p style={{ fontSize: '0.9rem', marginTop: 8 }}>Configuring questions and synchronizing timer.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 550, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Cannot Launch Examination</h3>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>{error}</p>
        <button className="btn btn-secondary" onClick={onExit}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const questions = attemptData?.questions || [];
  const currentQuestion = questions[currentIndex] || {};
  const currentAnswer = responses[currentQuestion.questionId] || {};

  const totalAnswered = questions.filter(
    (q) => responses[q.questionId]?.selectedOption || responses[q.questionId]?.descriptiveAnswer?.trim()
  ).length;

  const isLowTime = secondsRemaining < 300; // < 5 mins

  return (
    <div>
      {/* Top Sticky Header */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          margin: '-24px -24px 24px -24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 60,
          zIndex: 90,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={12} />
            <span>{saving ? 'Saving...' : lastSavedTime ? `Auto-saved at ${lastSavedTime}` : 'All changes saved'}</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '1.15rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            color: isLowTime ? '#ef4444' : 'var(--text-main)',
            background: isLowTime ? '#fef2f2' : 'var(--bg-surface)',
            padding: '6px 16px',
            borderRadius: '9999px',
            border: `1px solid ${isLowTime ? '#fca5a5' : 'var(--border)'}`
          }}
        >
          <Clock size={18} className={isLowTime ? 'pulse-anim' : ''} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <button
          className="btn btn-danger"
          style={{ background: '#ef4444' }}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          <Send size={15} />
          Submit Exam
        </button>
      </div>

      {/* Main Layout: Question Canvas & Navigator */}
      <div className="exam-layout">
        {/* Left Side: Question Canvas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-primary">Q{currentIndex + 1}</span>
                <span className="badge badge-neutral">{currentQuestion.topic || currentQuestion.subject}</span>
                <span className="badge badge-neutral">{currentQuestion.type?.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                +{currentQuestion.marks} Marks
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 24 }}>
              {currentQuestion.title}
            </h2>

            {/* MCQ Options */}
            {currentQuestion.type === 'mcq' && (
              <div>
                {currentQuestion.options?.map((opt) => {
                  const isSelected = currentAnswer.selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentQuestion.questionId, opt.id)}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'var(--primary)' : '#cbd5e1'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                        <strong style={{ marginRight: 6 }}>{opt.id}.</strong> {opt.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Descriptive Answer Box */}
            {currentQuestion.type === 'descriptive' && (
              <div>
                <label className="form-label" style={{ marginBottom: 8 }}>
                  Write your detailed response below:
                </label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 180, fontSize: '0.95rem' }}
                  placeholder="Type your explanation or answer here..."
                  value={currentAnswer.descriptiveAnswer || ''}
                  onChange={(e) => handleDescriptiveChange(currentQuestion.questionId, e.target.value)}
                  onBlur={() => handleDescriptiveBlur(currentQuestion.questionId)}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Auto-saved on blur or option change.
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: 18,
              marginTop: 32
            }}
          >
            <button
              className="btn btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                Next Question
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-success" onClick={() => setIsSubmitModalOpen(true)}>
                <Send size={15} />
                Review & Submit
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Question Navigator Palette */}
        <div>
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Question Palette</h4>

            <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: 'var(--primary)', borderRadius: 3 }} />
                <span>Answered ({totalAnswered})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3 }} />
                <span>Pending ({questions.length - totalAnswered})</span>
              </div>
            </div>

            <div className="question-nav-grid">
              {questions.map((q, idx) => {
                const isAnswered =
                  responses[q.questionId]?.selectedOption ||
                  responses[q.questionId]?.descriptiveAnswer?.trim();
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.questionId}
                    className={`q-badge ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : 'unanswered'}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>Total Questions:</strong> {questions.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <strong>Completed:</strong> {totalAnswered} of {questions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Examination Responses"
      >
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <HelpCircle size={48} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ready to finish the examination?</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6 }}>
            Once submitted, your answers will be locked and automatically evaluated.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              background: '#f8fafc',
              padding: 16,
              borderRadius: 12,
              margin: '20px 0',
              textAlign: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{totalAnswered}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ANSWERED</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
                {questions.length - totalAnswered}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNANSWERED</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={submitting}
            >
              Continue Exam
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmitExam}
              disabled={submitting}
            >
              {submitting ? 'Submitting Responses...' : 'Confirm Final Submission'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
