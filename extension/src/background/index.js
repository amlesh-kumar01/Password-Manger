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
  
  if (message.action === 'savePassword') {
    handleSavePassword(message.passwordData)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
  
  // Handle autofill credential requests
  if (message.action === 'getAutofillCredentials') {
    handleGetAutofillCredentials(message.urlData)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
  
  if (message.action === 'recordPasswordUsage') {
    handleRecordPasswordUsage(message.passwordId, message.formData)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
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

// Save password to server
const handleSavePassword = async (passwordData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Encrypt password before sending
    const encryptedData = {
      ...passwordData,
      password: encryptData(passwordData.password)
    };
    
    const response = await fetch(`${API_URL}/passwords`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encryptedData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save password');
    }
    
    const savedPassword = await response.json();
    
    // Notify user about successful save with a Chrome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icon128.png',
      title: 'Password Saved',
      message: `Password for ${passwordData.website} has been saved successfully.`,
      priority: 2
    });
    
    return { success: true, password: savedPassword };
  } catch (error) {
    console.error('Error saving password:', error);
    
    // Notify user about error with a Chrome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icon128.png',
      title: 'Password Save Failed',
      message: `Could not save password for ${passwordData.website}. Please try again.`,
      priority: 2
    });
    
    return { success: false, error: error.message };
  }
};

// Get matching credentials for autofill
const handleGetAutofillCredentials = async (urlData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Encode the complex data as query parameters
    const params = new URLSearchParams();
    params.append('url', urlData.url);
    
    if (urlData.formId) params.append('formId', urlData.formId);
    if (urlData.formAction) params.append('formAction', urlData.formAction);
    
    if (urlData.inputFields && urlData.inputFields.length > 0) {
      params.append('inputFields', JSON.stringify(urlData.inputFields));
    }
    
    // Make request to autofill endpoint
    const response = await fetch(`${API_URL}/passwords/autofill?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch autofill credentials');
    }
    
    const result = await response.json();
    
    // Decrypt passwords before returning
    if (result.success && result.data) {
      const passwords = result.data.map(password => ({
        ...password,
        password: decryptData(password.password)
      }));
      
      return { success: true, passwords };
    }
    
    return { success: false, error: 'No matching credentials found' };
  } catch (error) {
    console.error('Error getting autofill credentials:', error);
    return { success: false, error: error.message };
  }
};

// Record that a password was used for autofill
const handleRecordPasswordUsage = async (passwordId, formData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Make request to record usage
    const response = await fetch(`${API_URL}/passwords/record-usage/${passwordId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ formData })
    });
    
    if (!response.ok) {
      throw new Error('Failed to record password usage');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording password usage:', error);
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

// Listen for tab updates to check password detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Wait for the page to fully load
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Wait a bit to make sure content scripts are loaded
    setTimeout(() => {
      // Send a message to check if password fields are detected
      chrome.tabs.sendMessage(tabId, { action: 'checkPasswordDetection' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Error sending message to content script:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          console.log(`Password fields detected on ${tab.url}:`, response);
          
          // If password fields are found, we might want to update the extension icon or badge
          if (response.found) {
            chrome.action.setBadgeText({ tabId, text: response.count.toString() });
            chrome.action.setBadgeBackgroundColor({ tabId, color: '#4285F4' });
          }
        }
      });
    }, 1000);
  }
});

// Initialize extension
setupSync();
