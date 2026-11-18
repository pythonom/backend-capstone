import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Users,
  Shield,
  Layers,
  History,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Trash2
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const AdminPortal = () => {
  const [tab, setTab] = useState('users'); // 'users' | 'groups' | 'audit'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    facultyId: '',
    academicGroup: ''
  });

  const [newGroup, setNewGroup] = useState({
    name: '',
    code: '',
    department: 'Computer Science',
    semester: 6,
    academicYear: '2025-2026',
    description: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchAuditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users?limit=50');
      setUsers(res.data.data.users || []);
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

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit-logs?limit=50');
      setAuditLogs(res.data.data.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      setSuccess('User created successfully');
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', newGroup);
      setSuccess('Academic group created successfully');
      setIsGroupModalOpen(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (e) {
      setError('Failed to deactivate user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Administrator Portal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Manage institutional users, academic sections, and system-wide security audit trails.
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

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'users' ? 'active' : ''}`}
          onClick={() => { setTab('users'); setError(''); setSuccess(''); }}
        >
          <Users size={16} /> User Accounts ({users.length})
        </button>
        <button
          className={`tab-btn ${tab === 'groups' ? 'active' : ''}`}
          onClick={() => { setTab('groups'); setError(''); setSuccess(''); }}
        >
          <Layers size={16} /> Academic Groups & Sections ({groups.length})
        </button>
        <button
          className={`tab-btn ${tab === 'audit' ? 'active' : ''}`}
          onClick={() => { setTab('audit'); setError(''); setSuccess(''); }}
        >
          <History size={16} /> Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: USERS */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
            <div style={{ position: 'relative', maxWidth: 300, width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search user or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setIsUserModalOpen(true)}>
              <PlusCircle size={15} /> Add New User
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Section / Group</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'admin'
                            ? 'badge-danger'
                            : u.role === 'faculty'
                            ? 'badge-primary'
                            : 'badge-success'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{u.academicGroup?.name || 'Unassigned'}</td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      {u.isActive && u.role !== 'admin' && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeactivateUser(u._id)}
                          title="Deactivate account"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC GROUPS */}
      {tab === 'groups' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Academic Groups / Sections</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsGroupModalOpen(true)}>
              <PlusCircle size={15} /> Create Section
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Section Name</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Academic Year</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g._id}>
                    <td><strong>{g.name}</strong></td>
                    <td><span className="badge badge-primary">{g.code}</span></td>
                    <td>{g.department}</td>
                    <td>Semester {g.semester}</td>
                    <td>{g.academicYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {tab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Security Audit Trail</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchAuditLogs}>
              Refresh Logs
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Action Event</th>
                  <th>User</th>
                  <th>Exam / Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div><strong>{log.userId?.name || 'System / Unauth'}</strong></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.userRole || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {log.examId?.title || JSON.stringify(log.details || {})}
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.75rem' }}>{log.ipAddress || '127.0.0.1'}</code></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Create User Account">
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temporary Password *</label>
            <input
              type="password"
              className="form-input"
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Section</label>
              <select
                className="form-select"
                value={newUser.academicGroup}
                onChange={(e) => setNewUser({ ...newUser, academicGroup: e.target.value })}
              >
                <option value="">None / Unassigned</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            Create Account
          </button>
        </form>
      </Modal>

      {/* MODAL: CREATE GROUP */}
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create Academic Group / Section">
        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label className="form-label">Section Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Computer Science Section C"
              required
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Section Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CSE-2026-C"
                required
                value={newGroup.code}
                onChange={(e) => setNewGroup({ ...newGroup, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <input
                type="text"
                className="form-input"
                required
                value={newGroup.department}
                onChange={(e) => setNewGroup({ ...newGroup, department: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="12"
                required
                value={newGroup.semester}
                onChange={(e) => setNewGroup({ ...newGroup, semester: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input
                type="text"
                className="form-input"
                required
                value={newGroup.academicYear}
                onChange={(e) => setNewGroup({ ...newGroup, academicYear: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            Save Section
          </button>
        </form>
      </Modal>
    </div>
  );
};
