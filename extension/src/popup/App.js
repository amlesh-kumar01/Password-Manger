import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Passwords from './pages/Passwords';
import Forms from './pages/Forms';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PasswordProvider } from './context/PasswordContext';
import { FormDataProvider } from './context/FormDataContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-gray-600">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <PasswordProvider>
          <FormDataProvider>
            <div className="flex flex-col h-full bg-gray-50">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/passwords" element={
                  <ProtectedRoute>
                    <Passwords />
                  </ProtectedRoute>
                } />
                <Route path="/forms" element={
                  <ProtectedRoute>
                    <Forms />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </FormDataProvider>
        </PasswordProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
