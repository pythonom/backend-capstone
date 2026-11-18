import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('exam_portal_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const tokens = localStorage.getItem('exam_portal_tokens');
      if (tokens) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('exam_portal_user', JSON.stringify(res.data.data));
        } catch (err) {
          setUser(null);
          localStorage.removeItem('exam_portal_user');
          localStorage.removeItem('exam_portal_tokens');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, tokens } = res.data.data;
    setUser(userData);
    localStorage.setItem('exam_portal_user', JSON.stringify(userData));
    localStorage.setItem('exam_portal_tokens', JSON.stringify(tokens));
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { user: userData, tokens } = res.data.data;
    setUser(userData);
    localStorage.setItem('exam_portal_user', JSON.stringify(userData));
    localStorage.setItem('exam_portal_tokens', JSON.stringify(tokens));
    return userData;
  };

  const logout = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem('exam_portal_tokens') || '{}');
      if (tokens?.refreshToken) {
        await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
      }
    } catch (e) {
      // Ignore logout API error
    } finally {
      setUser(null);
      localStorage.removeItem('exam_portal_user');
      localStorage.removeItem('exam_portal_tokens');
    }
  };

  const quickLogin = async (role) => {
    let email = 'student@examportal.edu';
    let password = 'Student@123';

    if (role === 'admin') {
      email = 'admin@examportal.edu';
      password = 'Admin@123';
    } else if (role === 'faculty') {
      email = 'prof.sharma@examportal.edu';
      password = 'Faculty@123';
    } else if (role === 'student') {
      email = 'rahul.verma@student.edu';
      password = 'Student@123';
    } else if (role === 'student2') {
      email = 'ananya.singh@student.edu';
      password = 'Student@123';
    } else if (role === 'student3') {
      email = 'rohit.kumar@student.edu';
      password = 'Student@123';
    }

    return login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        loading,
        login,
        register,
        logout,
        quickLogin,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
