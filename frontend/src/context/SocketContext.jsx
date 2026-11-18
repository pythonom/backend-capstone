import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      // If student is logged in, join personal room
      if (user?._id && user?.role === 'student') {
        socketInstance.emit('join:student_room', user._id);
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    // Global event: Exam published
    socketInstance.on('exam:published', (data) => {
      addToast({
        title: 'New Examination Published!',
        message: `${data.title} (${data.course}) has been scheduled.`,
        type: 'info'
      });
    });

    // Student event: Exam results released
    socketInstance.on('exam:results_released', (data) => {
      addToast({
        title: 'Results Published!',
        message: `Results for ${data.title} are now released and available for review.`,
        type: 'success'
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id, user?.role]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random().toString();
    setNotifications((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        addToast,
        removeToast
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
