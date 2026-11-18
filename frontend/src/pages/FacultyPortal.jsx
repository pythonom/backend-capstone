import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import {
  BookOpen,
  PlusCircle,
  FileText,
  BarChart3,
  Activity,
  CheckSquare,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  Play,
  Send,
  Eye,
  Award,
  Radio,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const FacultyPortal = () => {
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'questions' | 'create-exam' | 'monitoring' | 'grading' | 'analytics'
  const { socket } = useSocket();

  // Data states
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

  // New Question Form state
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    type: 'mcq',
    subject: 'Computer Science',
    topic: '',
    difficulty: 'medium',
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' }
    ],
    correctAnswer: 'A',
    explanation: ''
  });

  // New Exam Form state
  const [newExam, setNewExam] = useState({
    title: '',
    course: '',
    description: '',
    instructions: 'Read questions carefully. Time limit strictly enforced.',
    durationMinutes: 60,
    startTime: new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    selectedQuestionIds: [],
    assignedGroupIds: [],
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      negativeMarking: true,
      defaultNegativeMarksPerQuestion: 0.5,
      isResultReleased: false,
      showQuestionReviewToStudent: false
    }
  });

  // Monitoring state
  const [liveEvents, setLiveEvents] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);

  // Analytics state
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [analyticsQuestions, setAnalyticsQuestions] = useState([]);
  const [analyticsSections, setAnalyticsSections] = useState([]);
  const [analyticsLeaderboard, setAnalyticsLeaderboard] = useState([]);

  // Grading state
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [gradingEvaluations, setGradingEvaluations] = useState([]);

  // Load initial data
  useEffect(() => {
    fetchExams();
    fetchQuestions();
    fetchGroups();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data.exams || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions?limit=100');
      setQuestions(res.data.data.questions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Socket.IO Proctoring Room Listener
  useEffect(() => {
    if (!socket || !selectedExamId || activeTab !== 'monitoring') return;

    socket.emit('join:exam_monitoring', selectedExamId);

    const handleStarted = (data) => {
      setLiveEvents((prev) => [
        {
          id: Date.now(),
          type: 'start',
          text: `Student ${data.studentName} (${data.studentEmail}) started the exam.`,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      fetchExamAttempts(selectedExamId);
    };

    const handleSubmitted = (data) => {
      setLiveEvents((prev) => [
        {
          id: Date.now(),
          type: 'submit',
          text: `Student ${data.studentName} submitted responses. Score: ${data.totalScore}/${data.maxScore}.`,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      fetchExamAttempts(selectedExamId);
    };

    socket.on('exam:attempt_started', handleStarted);
    socket.on('exam:attempt_submitted', handleSubmitted);

    return () => {
      socket.emit('leave:exam_monitoring', selectedExamId);
      socket.off('exam:attempt_started', handleStarted);
      socket.off('exam:attempt_submitted', handleSubmitted);
    };
  }, [socket, selectedExamId, activeTab]);

  const fetchExamAttempts = async (examId) => {
    try {
      const res = await api.get(`/attempts/exams/${examId}/attempts`);
      setExamAttempts(res.data.data.attempts || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenMonitoring = (examId) => {
    setSelectedExamId(examId);
    setActiveTab('monitoring');
    setLiveEvents([]);
    fetchExamAttempts(examId);
  };

  const handleOpenAnalytics = async (examId) => {
    setSelectedExamId(examId);
    setActiveTab('analytics');
    setLoading(true);
    try {
      const [overviewRes, qRes, secRes, leadRes] = await Promise.all([
        api.get(`/analytics/exams/${examId}/overview`),
        api.get(`/analytics/exams/${examId}/questions`),
        api.get(`/analytics/exams/${examId}/sections`),
        api.get(`/analytics/exams/${examId}/leaderboard`)
      ]);
      setAnalyticsOverview(overviewRes.data.data);
      setAnalyticsQuestions(qRes.data.data);
      setAnalyticsSections(secRes.data.data);
      setAnalyticsLeaderboard(leadRes.data.data);
    } catch (e) {
      setError('Failed to load analytics for this examination');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishExam = async (examId) => {
    try {
      await api.post(`/exams/${examId}/publish`);
      setSuccess('Examination published successfully!');
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish examination');
    }
  };

  const handleReleaseResults = async (examId) => {
    try {
      await api.post(`/exams/${examId}/release-results`, { showQuestionReview: true });
      setSuccess('Results successfully released to all students!');
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release results');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newQuestion.title,
        type: newQuestion.type,
        subject: newQuestion.subject,
        topic: newQuestion.topic,
        difficulty: newQuestion.difficulty,
        marks: Number(newQuestion.marks),
        negativeMarks: Number(newQuestion.negativeMarks),
        options: newQuestion.type === 'mcq' ? newQuestion.options : [],
        correctAnswer: newQuestion.correctAnswer,
        explanation: newQuestion.explanation
      };
      await api.post('/questions', payload);
      setSuccess('Question added to question bank!');
      setIsQuestionModalOpen(false);
      fetchQuestions();
      // Reset
      setNewQuestion({
        title: '',
        type: 'mcq',
        subject: 'Computer Science',
        topic: '',
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correctAnswer: 'A',
        explanation: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question from question bank?')) return;
    try {
      await api.delete(`/questions/${qId}`);
      fetchQuestions();
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (newExam.selectedQuestionIds.length === 0) {
      setError('Please select at least one question for the examination');
      return;
    }

    try {
      const questionsPayload = newExam.selectedQuestionIds.map((qId) => {
        const qObj = questions.find((q) => q._id === qId);
        return {
          questionId: qId,
          marks: qObj?.marks || 2,
          negativeMarks: qObj?.negativeMarks || 0.5
        };
      });

      await api.post('/exams', {
        title: newExam.title,
        course: newExam.course,
        description: newExam.description,
        instructions: newExam.instructions,
        durationMinutes: Number(newExam.durationMinutes),
        startTime: new Date(newExam.startTime).toISOString(),
        endTime: new Date(newExam.endTime).toISOString(),
        assignedGroups: newExam.assignedGroupIds,
        questions: questionsPayload,
        settings: newExam.settings
      });

      setSuccess('Examination created successfully! You can publish it when ready.');
      fetchExams();
      setActiveTab('exams');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create examination');
    }
  };

  const handleOpenGradingModal = (attempt) => {
    setGradingAttempt(attempt);
    const descResponses = attempt.responses.filter((r) => r.descriptiveAnswer);
    setGradingEvaluations(
      descResponses.map((r) => ({
        questionId: r.questionId?._id || r.questionId,
        marksAwarded: r.marksAwarded || 0,
        feedback: r.facultyFeedback || ''
      }))
    );
    setIsGradingModalOpen(true);
  };

  const handleSubmitEvaluation = async () => {
    try {
      await api.post(`/attempts/${gradingAttempt._id}/evaluate-descriptive`, {
        evaluations: gradingEvaluations
      });
      setSuccess('Descriptive answers graded and scores updated!');
      setIsGradingModalOpen(false);
      fetchExamAttempts(selectedExamId);
    } catch (err) {
      setError('Failed to submit evaluation');
    }
  };

  // Helper for question selection toggle
  const toggleQuestionSelect = (qId) => {
    setNewExam((prev) => {
      const exists = prev.selectedQuestionIds.includes(qId);
      return {
        ...prev,
        selectedQuestionIds: exists
          ? prev.selectedQuestionIds.filter((id) => id !== qId)
          : [...prev.selectedQuestionIds, qId]
      };
    });
  };

  const toggleGroupSelect = (gId) => {
    setNewExam((prev) => {
      const exists = prev.assignedGroupIds.includes(gId);
      return {
        ...prev,
        assignedGroupIds: exists
          ? prev.assignedGroupIds.filter((id) => id !== gId)
          : [...prev.assignedGroupIds, gId]
      };
    });
  };

  const totalCalculatedMarks = newExam.selectedQuestionIds.reduce((sum, qId) => {
    const qObj = questions.find((q) => q._id === qId);
    return sum + (qObj?.marks || 0);
  }, 0);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Faculty Control Center</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Author question banks, orchestrate examinations, supervise live sessions, and view performance aggregations.
        </p>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#047857', marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => { setActiveTab('exams'); setError(''); setSuccess(''); }}
        >
          <FileText size={16} /> My Examinations
        </button>
        <button
          className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => { setActiveTab('questions'); setError(''); setSuccess(''); }}
        >
          <BookOpen size={16} /> Question Bank ({questions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'create-exam' ? 'active' : ''}`}
          onClick={() => { setActiveTab('create-exam'); setError(''); setSuccess(''); }}
        >
          <PlusCircle size={16} /> Create Examination
        </button>
        {selectedExamId && (
          <>
            <button
              className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitoring')}
            >
              <Radio size={16} /> Live Proctoring
            </button>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleOpenAnalytics(selectedExamId)}
            >
              <BarChart3 size={16} /> Aggregation Analytics
            </button>
          </>
        )}
      </div>

      {/* TAB 1: EXAMINATIONS LIST */}
      {activeTab === 'exams' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Scheduled Examinations</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('create-exam')}>
              <PlusCircle size={14} /> New Exam
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title & Course</th>
                  <th>Questions / Marks</th>
                  <th>Duration</th>
                  <th>Schedule Window</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{exam.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exam.course}</div>
                    </td>
                    <td>
                      {exam.questions?.length || 0} Questions
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Total: {exam.totalMarks} Marks
                      </div>
                    </td>
                    <td>{exam.durationMinutes} mins</td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {new Date(exam.startTime).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      {exam.status === 'published' ? (
                        <span className="badge badge-success">Published</span>
                      ) : (
                        <span className="badge badge-warning">Draft</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {exam.status === 'draft' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handlePublishExam(exam._id)}
                            title="Publish exam to students"
                          >
                            <Play size={12} /> Publish
                          </button>
                        )}

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenMonitoring(exam._id)}
                          title="Open live monitoring proctor room"
                        >
                          <Radio size={12} style={{ color: 'var(--primary)' }} /> Live
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenAnalytics(exam._id)}
                          title="View Aggregation Analytics"
                        >
                          <BarChart3 size={12} style={{ color: 'var(--secondary)' }} /> Analytics
                        </button>

                        {!exam.settings?.isResultReleased ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReleaseResults(exam._id)}
                            title="Release results and review to students"
                          >
                            <Award size={12} /> Release Results
                          </button>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Results Released</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Question Bank Repository</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsQuestionModalOpen(true)}>
              <PlusCircle size={15} /> Add New Question
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Question Title</th>
                  <th>Type</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{q.title}</div>
                      {q.type === 'mcq' && q.options && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Answer Key: Option {q.correctAnswer} • {q.options.length} Choices
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{q.type.toUpperCase()}</span>
                    </td>
                    <td>{q.topic}</td>
                    <td>
                      <span
                        className={`badge ${
                          q.difficulty === 'easy'
                            ? 'badge-success'
                            : q.difficulty === 'hard'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td>
                      +{q.marks} {q.negativeMarks > 0 && <span style={{ color: '#ef4444' }}>(-{q.negativeMarks})</span>}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: '#ef4444' }}
                        onClick={() => handleDeleteQuestion(q._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREATE EXAMINATION */}
      {activeTab === 'create-exam' && (
        <div className="card" style={{ maxWidth: 840, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>
            Create & Schedule Examination
          </h3>

          <form onSubmit={handleCreateExam}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Examination Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CS301 - Mid-Term Assessment"
                  required
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Code / Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CS301 - Data Structures"
                  required
                  value={newExam.course}
                  onChange={(e) => setNewExam({ ...newExam, course: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of examination topics"
                value={newExam.description}
                onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Duration (Minutes) *</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="720"
                  required
                  value={newExam.durationMinutes}
                  onChange={(e) => setNewExam({ ...newExam, durationMinutes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  required
                  value={newExam.startTime}
                  onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  required
                  value={newExam.endTime}
                  onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* Academic Groups (Sections) Multi-select */}
            <div className="form-group">
              <label className="form-label">Assign to Academic Groups / Sections:</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {groups.map((g) => {
                  const isChecked = newExam.assignedGroupIds.includes(g._id);
                  return (
                    <button
                      type="button"
                      key={g._id}
                      className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleGroupSelect(g._id)}
                    >
                      <Users size={13} /> {g.name} ({g.code})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Selector from Question Bank */}
            <div className="form-group" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Select Questions from Question Bank ({newExam.selectedQuestionIds.length} Selected)
                </label>
                <span className="badge badge-primary" style={{ fontSize: '0.82rem' }}>
                  Total Exam Marks: {totalCalculatedMarks}
                </span>
              </div>

              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 10,
                  background: '#f8fafc'
                }}
              >
                {questions.map((q) => {
                  const isSelected = newExam.selectedQuestionIds.includes(q._id);
                  return (
                    <div
                      key={q._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: isSelected ? '#eef2ff' : '#ffffff',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 6,
                        marginBottom: 6,
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleQuestionSelect(q._id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="checkbox" checked={isSelected} readOnly />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{q.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="badge badge-neutral">{q.type}</span>
                        <span className="badge badge-primary">+{q.marks}M</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Rules & Randomization Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '20px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={newExam.settings.randomizeQuestions}
                  onChange={(e) =>
                    setNewExam({
                      ...newExam,
                      settings: { ...newExam.settings, randomizeQuestions: e.target.checked }
                    })
                  }
                />
                Randomize Question Order per student
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={newExam.settings.randomizeOptions}
                  onChange={(e) =>
                    setNewExam({
                      ...newExam,
                      settings: { ...newExam.settings, randomizeOptions: e.target.checked }
                    })
                  }
                />
                Randomize MCQ Options per attempt
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={newExam.settings.negativeMarking}
                  onChange={(e) =>
                    setNewExam({
                      ...newExam,
                      settings: { ...newExam.settings, negativeMarking: e.target.checked }
                    })
                  }
                />
                Enable Negative Marking penalties
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Save Examination Schedule
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: LIVE PROCTORING DASHBOARD */}
      {activeTab === 'monitoring' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-danger">
                  <Radio size={12} className="pulse-anim" /> LIVE PROCTOR ROOM
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Real-time Session Monitoring</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Listening to live WebSocket events for selected examination.
              </p>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => fetchExamAttempts(selectedExamId)}>
              Refresh Attempts
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Left: Candidate Attempts List */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Candidate Status</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examAttempts.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                          No students have initiated an attempt yet.
                        </td>
                      </tr>
                    ) : (
                      examAttempts.map((att) => (
                        <tr key={att._id}>
                          <td>
                            <strong>{att.studentId?.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{att.studentId?.email}</div>
                          </td>
                          <td>{att.studentId?.studentId || 'N/A'}</td>
                          <td>
                            <span
                              className={`badge ${
                                att.status === 'in_progress'
                                  ? 'badge-warning'
                                  : att.status === 'evaluated'
                                  ? 'badge-success'
                                  : 'badge-primary'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td>
                            <strong>{att.score?.totalScore}</strong> / {att.score?.maxScore}
                          </td>
                          <td>
                            {att.responses?.some((r) => r.descriptiveAnswer) && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenGradingModal(att)}
                              >
                                Grade Descriptive
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Live Event Feed via Socket.IO */}
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={16} style={{ color: 'var(--primary)' }} /> Live Event Stream
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {liveEvents.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                    Awaiting live candidate actions...
                  </div>
                ) : (
                  liveEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: 10,
                        background: '#f8fafc',
                        borderLeft: `3px solid ${ev.type === 'submit' ? '#10b981' : '#4f46e5'}`,
                        borderRadius: 6,
                        fontSize: '0.8rem'
                      }}
                    >
                      <div>{ev.text}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{ev.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AGGREGATION ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Aggregation Performance Analytics</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Computed via high-performance MongoDB aggregation pipelines.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenAnalytics(selectedExamId)}>
              Refresh Analytics
            </button>
          </div>

          {analyticsOverview && (
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e0e7ff', color: 'var(--primary)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analyticsOverview.totalSubmissions}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Submissions</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analyticsOverview.passRatePercentage}%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pass Rate ({analyticsOverview.passedCount} Passed)
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#eff6ff', color: 'var(--secondary)' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analyticsOverview.averageScore}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Average Marks (Max: {analyticsOverview.highestScore})
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analyticsOverview.activeAttemptsCount}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Ongoing Attempts</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-grid: Question Discrimination & Section Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Question Accuracy Table */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Question Accuracy Breakdown</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Attempts</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsQuestions.map((q) => (
                      <tr key={q.questionId}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{q.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{q.topic}</div>
                        </td>
                        <td>{q.totalAttempts}</td>
                        <td>
                          <strong style={{ color: q.accuracyRatePercentage < 50 ? '#ef4444' : '#10b981' }}>
                            {q.accuracyRatePercentage}%
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section Comparison Table */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Academic Section Comparison</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Submissions</th>
                      <th>Avg Score</th>
                      <th>Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsSections.map((sec) => (
                      <tr key={sec.groupCode}>
                        <td>
                          <strong>{sec.groupName}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sec.groupCode}</div>
                        </td>
                        <td>{sec.totalSubmissions}</td>
                        <td>{sec.averageScore}</td>
                        <td>
                          <span className="badge badge-success">{sec.passRatePercentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Student Leaderboard */}
          <div className="card">
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Student Rank Leaderboard</h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Section</th>
                    <th>Total Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsLeaderboard.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: item.rank === 1 ? '#d97706' : item.rank === 2 ? '#64748b' : '#0f172a'
                          }}
                        >
                          #{item.rank}
                        </span>
                      </td>
                      <td><strong>{item.studentName}</strong></td>
                      <td>{item.studentRollNo || 'N/A'}</td>
                      <td>{item.groupName}</td>
                      <td><strong>{item.totalScore}</strong> / {item.maxScore}</td>
                      <td>{item.percentage}%</td>
                      <td>
                        <span className={`badge ${item.passed ? 'badge-success' : 'badge-danger'}`}>
                          {item.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD QUESTION */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title="Add Question to Question Bank"
      >
        <form onSubmit={handleCreateQuestion}>
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea
              className="form-textarea"
              placeholder="Enter question statement..."
              required
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Question Type</label>
              <select
                className="form-select"
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
              >
                <option value="mcq">Multiple Choice Question (MCQ)</option>
                <option value="descriptive">Descriptive Question</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={newQuestion.difficulty}
                onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Topic *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Trees, Paging"
                required
                value={newQuestion.topic}
                onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marks *</label>
              <input
                type="number"
                className="form-input"
                min="0.5"
                step="0.5"
                required
                value={newQuestion.marks}
                onChange={(e) => setNewQuestion({ ...newQuestion, marks: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Negative Marks</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.25"
                value={newQuestion.negativeMarks}
                onChange={(e) => setNewQuestion({ ...newQuestion, negativeMarks: e.target.value })}
              />
            </div>
          </div>

          {newQuestion.type === 'mcq' && (
            <div>
              <label className="form-label">Options & Correct Answer</label>
              {newQuestion.options.map((opt, idx) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, width: 24 }}>{opt.id}.</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Option ${opt.id} text`}
                    required
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...newQuestion.options];
                      updated[idx].text = e.target.value;
                      setNewQuestion({ ...newQuestion, options: updated });
                    }}
                  />
                  <input
                    type="radio"
                    name="correctAnswerSelect"
                    checked={newQuestion.correctAnswer === opt.id}
                    onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: opt.id })}
                    title="Mark as correct answer"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correct</span>
                </div>
              ))}
            </div>
          )}

          {newQuestion.type === 'descriptive' && (
            <div className="form-group">
              <label className="form-label">Evaluation Rubric / Correct Answer Key</label>
              <textarea
                className="form-textarea"
                placeholder="Key concepts or grading rubric expected from student..."
                required
                value={newQuestion.correctAnswer}
                onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Explanation (Revealed upon result release)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Why this answer is correct..."
              value={newQuestion.explanation}
              onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            Save Question
          </button>
        </form>
      </Modal>

      {/* MODAL: GRADE DESCRIPTIVE ANSWERS */}
      <Modal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        title="Grade Descriptive Responses"
      >
        <div>
          {gradingAttempt?.responses
            ?.filter((r) => r.descriptiveAnswer)
            .map((resp, idx) => {
              const evalObj = gradingEvaluations.find(
                (ev) => ev.questionId === (resp.questionId?._id || resp.questionId)
              ) || { marksAwarded: 0, feedback: '' };

              return (
                <div key={idx} style={{ padding: 14, background: '#f8fafc', borderRadius: 8, marginBottom: 14, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                    Q: {resp.questionId?.title || 'Descriptive Question'}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    Student Response:
                  </div>
                  <div style={{ padding: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.88rem', marginBottom: 12 }}>
                    {resp.descriptiveAnswer}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                    <div>
                      <label className="form-label">Marks (Max {resp.maxMarks}):</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        max={resp.maxMarks}
                        step="0.5"
                        value={evalObj.marksAwarded}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setGradingEvaluations((prev) =>
                            prev.map((item) =>
                              item.questionId === (resp.questionId?._id || resp.questionId)
                                ? { ...item, marksAwarded: val }
                                : item
                            )
                          );
                        }}
                      />
                    </div>
                    <div>
                      <label className="form-label">Feedback for Student:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Constructive remarks..."
                        value={evalObj.feedback}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGradingEvaluations((prev) =>
                            prev.map((item) =>
                              item.questionId === (resp.questionId?._id || resp.questionId)
                                ? { ...item, feedback: val }
                                : item
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSubmitEvaluation}>
            Submit Evaluation & Update Total Score
          </button>
        </div>
      </Modal>
    </div>
  );
};
