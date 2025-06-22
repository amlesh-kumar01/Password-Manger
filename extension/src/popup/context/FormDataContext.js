import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../../utils/constants';
import { encryptData, decryptData } from '../../utils/encryption';

const FormDataContext = createContext(null);

export const useFormData = () => useContext(FormDataContext);

export const FormDataProvider = ({ children }) => {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    // Fetch form data when user is authenticated
    if (isAuthenticated) {
      fetchFormData();
    } else {
      setFormData([]);
    }
  }, [isAuthenticated]);

  // Get all form data
  const fetchFormData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/forms`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Decrypt sensitive form data
      const decryptedFormData = response.data.map(form => ({
        ...form,
        fields: form.fields.map(field => ({
          ...field,
          value: field.sensitive ? decryptData(field.value) : field.value
        }))
      }));
      
      setFormData(decryptedFormData);
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError('Failed to fetch form data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new form data
  const addFormData = async (formDataItem) => {
    try {
      setLoading(true);
      setError(null);
      
      // Encrypt sensitive fields
      const encryptedData = {
        ...formDataItem,
        fields: formDataItem.fields.map(field => ({
          ...field,
          value: field.sensitive ? encryptData(field.value) : field.value
        }))
      };
      
      const response = await axios.post(`${API_URL}/forms`, encryptedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Add form data with decrypted fields to state
      setFormData([
        ...formData,
        {
          ...response.data,
          fields: response.data.fields.map(field => ({
            ...field,
            value: field.sensitive ? decryptData(field.value) : field.value
          }))
        }
      ]);
      
      return true;
    } catch (err) {
      console.error('Error adding form data:', err);
      setError('Failed to add form data. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update form data
  const updateFormData = async (id, formDataItem) => {
    try {
      setLoading(true);
      setError(null);
      
      // Encrypt sensitive fields
      const encryptedData = {
        ...formDataItem,
        fields: formDataItem.fields.map(field => ({
          ...field,
          value: field.sensitive ? encryptData(field.value) : field.value
        }))
      };
      
      await axios.put(`${API_URL}/forms/${id}`, encryptedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update form data in state
      setFormData(formData.map(f => 
        f._id === id 
          ? {
              ...f,
              ...formDataItem,
              fields: formDataItem.fields.map(field => ({
                ...field,
                value: field.sensitive ? field.value : field.value
              }))
            }
          : f
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating form data:', err);
      setError('Failed to update form data. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete form data
  const deleteFormData = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_URL}/forms/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove form data from state
      setFormData(formData.filter(f => f._id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting form data:', err);
      setError('Failed to delete form data. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    formData,
    loading,
    error,
    fetchFormData,
    addFormData,
    updateFormData,
    deleteFormData,
    setError
  };

  return (
    <FormDataContext.Provider value={value}>
      {children}
    </FormDataContext.Provider>
  );
};
