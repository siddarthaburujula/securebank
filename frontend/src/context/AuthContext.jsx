import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('securebank_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('securebank_token');
    if (!token) {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { usernameOrEmail: username, username, password });
    if (response.data && response.data.success) {
      const authData = response.data.data;
      localStorage.setItem('securebank_token', authData.token);
      const userData = {
        username: authData.username,
        role: authData.role,
        fullName: authData.fullName,
        accountNumber: authData.accountNumber,
        accountStatus: authData.accountStatus,
        token: authData.token,
      };
      localStorage.setItem('securebank_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(response.data?.message || 'Login failed');
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('securebank_token');
    localStorage.removeItem('securebank_user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUserProfile = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('securebank_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ROLE_ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
