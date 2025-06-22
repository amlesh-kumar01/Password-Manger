import { API_URL, SYNC_INTERVAL } from '../utils/constants';
import { encryptData, decryptData } from '../utils/encryption';

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Password & Form Manager extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPasswords') {
    handleGetPasswords(message.url)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
  
  if (message.action === 'getFormData') {
    handleGetFormData(message.url)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
  
  if (message.action === 'saveFormData') {
    handleSaveFormData(message.formData)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
});

// Get passwords for a URL
const handleGetPasswords = async (url) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const domain = extractDomain(url);
    
    const response = await fetch(`${API_URL}/passwords/site/${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch passwords');
    }
    
    const passwords = await response.json();
    
    // Decrypt passwords
    const decryptedPasswords = passwords.map(password => ({
      ...password,
      password: decryptData(password.password)
    }));
    
    return { success: true, passwords: decryptedPasswords };
  } catch (error) {
    console.error('Error getting passwords:', error);
    return { success: false, error: error.message };
  }
};

// Get form data for a URL
const handleGetFormData = async (url) => {
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
const handleSaveFormData = async (formData) => {
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

// Helper to get auth token from storage
const getAuthToken = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token || null);
    });
  });
};

// Extract domain from URL
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Set up periodic sync with server
const setupSync = () => {
  const syncData = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      // Sync logic would go here
      console.log('Syncing data with server...');
    } catch (error) {
      console.error('Sync error:', error);
    }
  };
  
  // Initial sync
  syncData();
  
  // Setup interval
  setInterval(syncData, SYNC_INTERVAL);
};

// Initialize extension
setupSync();
