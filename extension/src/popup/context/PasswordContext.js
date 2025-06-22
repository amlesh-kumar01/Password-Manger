import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../../utils/constants';
import { encryptData, decryptData } from '../../utils/encryption';

const PasswordContext = createContext(null);

export const usePasswords = () => useContext(PasswordContext);

export const PasswordProvider = ({ children }) => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    // Fetch passwords when user is authenticated
    if (isAuthenticated) {
      fetchPasswords();
    } else {
      setPasswords([]);
    }
  }, [isAuthenticated]);

  // Get all passwords
  const fetchPasswords = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/passwords`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Decrypt passwords
      const decryptedPasswords = response.data.map(password => ({
        ...password,
        password: decryptData(password.password)
      }));
      
      setPasswords(decryptedPasswords);
    } catch (err) {
      console.error('Error fetching passwords:', err);
      setError('Failed to fetch passwords. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new password
  const addPassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Encrypt password before sending to server
      const encryptedData = {
        ...passwordData,
        password: encryptData(passwordData.password)
      };
      
      const response = await axios.post(`${API_URL}/passwords`, encryptedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Add decrypted password to state
      setPasswords([
        ...passwords,
        {
          ...response.data,
          password: passwordData.password
        }
      ]);
      
      return true;
    } catch (err) {
      console.error('Error adding password:', err);
      setError('Failed to add password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (id, passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Encrypt password before sending to server
      const encryptedData = {
        ...passwordData,
        password: encryptData(passwordData.password)
      };
      
      await axios.put(`${API_URL}/passwords/${id}`, encryptedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update password in state
      setPasswords(passwords.map(p => 
        p._id === id 
          ? { ...p, ...passwordData }
          : p
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete password
  const deletePassword = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_URL}/passwords/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove password from state
      setPasswords(passwords.filter(p => p._id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting password:', err);
      setError('Failed to delete password. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    passwords,
    loading,
    error,
    fetchPasswords,
    addPassword,
    updatePassword,
    deletePassword,
    setError
  };

  return (
    <PasswordContext.Provider value={value}>
      {children}
    </PasswordContext.Provider>
  );
};
