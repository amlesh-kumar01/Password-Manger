import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        setLoading(true);
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          // Validate token with backend
          const response = await axios.get(`${API_URL}/auth/validate`, {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          });
          
          if (response.data.valid) {
            setToken(storedToken);
            setCurrentUser(response.data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setError('Session expired. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-in
  const googleSignIn = async (googleToken) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: googleToken
      });
      
      const { token, user } = response.data;
      
      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      
      return true;
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError(err.response?.data?.message || 'Google Sign-in failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });
      
      const { token, user } = response.data;
      
      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout endpoint to invalidate token on server
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      // Still remove token from local storage and state on client side
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    googleSignIn,
    register,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
