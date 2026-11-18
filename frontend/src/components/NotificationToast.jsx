import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const NotificationToast = () => {
  const { notifications, removeToast } = useSocket();

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        width: '100%'
      }}
    >
      {notifications.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${
              toast.type === 'success' ? '#10b981' : toast.type === 'danger' ? '#ef4444' : '#4f46e5'
            }`,
            borderRadius: 8,
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}
        >
          <div style={{ color: toast.type === 'success' ? '#10b981' : '#4f46e5', marginTop: 2 }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{toast.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {toast.message}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light)',
              cursor: 'pointer',
              padding: 2
            }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
