import { API_URL } from '../utils/constants';
import { encryptData, decryptData } from '../utils/encryption';
import { extractDomain, getAuthToken } from './utils';

// Get form data for a URL
export const handleGetFormData = async (url) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const domain = extractDomain(url);
    
    const response = await fetch(`${API_URL}/forms/site/${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch form data');
    }
    
    const formData = await response.json();
    
    // Decrypt sensitive form fields
    const decryptedFormData = formData.map(form => ({
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        value: field.sensitive ? decryptData(field.value) : field.value
      }))
    }));
    
    return { success: true, formData: decryptedFormData };
  } catch (error) {
    console.error('Error getting form data:', error);
    return { success: false, error: error.message };
  }
};

// Save form data
export const handleSaveFormData = async (formData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Encrypt sensitive fields
    const encryptedData = {
      ...formData,
      fields: formData.fields.map(field => ({
        ...field,
        value: field.sensitive ? encryptData(field.value) : field.value
      }))
    };
    
    const response = await fetch(`${API_URL}/forms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encryptedData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save form data');
    }
    
    const savedFormData = await response.json();
    
    return { success: true, formData: savedFormData };
  } catch (error) {
    console.error('Error saving form data:', error);
    return { success: false, error: error.message };
  }
};