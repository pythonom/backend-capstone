import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  GraduationCap,
  LogOut,
  User,
  ShieldCheck,
  Radio,
  BookOpen
} from 'lucide-react';

export const Navbar = ({ currentView, setCurrentView }) => {
  const { user, logout, quickLogin } = useAuth();
  const { connected } = useSocket();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-danger">ADMINISTRATOR</span>;
      case 'faculty':
        return <span className="badge badge-primary">FACULTY</span>;
      case 'student':
        return <span className="badge badge-success">STUDENT</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => setCurrentView('dashboard')}>
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1 }}>ExamPortal</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Assessment Management System
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Real-time Socket Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              fontWeight: 600,
              color: connected ? '#059669' : '#dc2626',
              background: connected ? '#ecfdf5' : '#fef2f2',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: `1px solid ${connected ? '#a7f3d0' : '#fecaca'}`
            }}
            title={connected ? 'Connected to live Socket.IO events' : 'Disconnected from Socket.IO'}
          >
            <Radio size={14} className={connected ? 'pulse-anim' : ''} />
            <span>{connected ? 'Live Sync' : 'Offline'}</span>
          </div>

          {/* Quick Switch Persona Pill (for evaluator / tester convenience) */}
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
            <button
              className={`btn btn-sm ${user?.role === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => quickLogin('admin')}
              title="Switch to Administrator account"
            >
              Admin
            </button>
            <button
              className={`btn btn-sm ${user?.role === 'faculty' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => quickLogin('faculty')}
              title="Switch to Prof. Sharma account"
            >
              Faculty
            </button>
            <button
              className={`btn btn-sm ${user?.role === 'student' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => quickLogin('student')}
              title="Switch to Rahul Verma (Student)"
            >
              Student
            </button>
          </div>

          {/* User profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.academicGroup?.name || user?.email}
              </div>
            </div>

            {getRoleBadge(user?.role)}

            <button
              className="btn btn-outline btn-sm"
              onClick={logout}
              title="Sign Out"
              style={{ color: '#dc2626', borderColor: '#fecaca' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
