import { API_URL, FALLBACK_API_URL, SYNC_INTERVAL } from '../utils/constants';
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
    let offlineMode = false;
    
    // Check if we have authentication
    if (!token) {
      console.log('No authentication token, attempting to save password locally');
      offlineMode = true;
    }
    
    // Encrypt password before sending
    const encryptedData = {
      ...passwordData,
      password: encryptData(passwordData.password)
    };
    
    console.log('Sending password data to server:', {...encryptedData, password: '****'});
    
    // Ensure required fields are present
    if (!encryptedData.username) {
      // Set a default username if missing
      encryptedData.username = 'Unknown User';
    }
    
    // Ensure we have a website
    if (!encryptedData.website) {
      encryptedData.website = extractDomain(encryptedData.url || window.location.href);
    }
      // Try to reach the server
    try {console.log('Attempting to save password to server with URL:', `${API_URL}/passwords`);
      console.log('Auth token exists:', !!token);
      
      // Log headers and request body for debugging (with password masked)
      const debugData = {
        headers: {
          'Authorization': token ? `Bearer ${token.substring(0, 10)}...` : 'No token',
          'Content-Type': 'application/json'
        },
        body: {...encryptedData, password: '****'}
      };
      console.log('Request details:', debugData);
      
      // Add a timestamp to ensure we're not getting cached responses
      const timestamp = new Date().getTime();
      let response;
      
      try {
        // Try primary URL first
        response = await fetch(`${API_URL}/passwords?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(encryptedData),
          // Ensure we don't use cached responses
          cache: 'no-cache'
        });
      } catch (primaryUrlError) {
        console.warn('Primary URL failed, trying fallback URL:', primaryUrlError);
        
        // Try fallback URL if primary fails
        response = await fetch(`${FALLBACK_API_URL}/passwords?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(encryptedData),
          // Ensure we don't use cached responses
          cache: 'no-cache'
        });
      }
      
      console.log('Server response status:', response.status);
      console.log('Server response headers:', [...response.headers.entries()]);
      
      // Check for specific error responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Server error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorData = { message: `HTTP error ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to save password: ${response.status}`);
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
    } catch (serverError) {
      console.error('Server error, falling back to offline mode:', serverError);
      
      // If server save fails, try local save as fallback
      const result = await savePasswordLocally(passwordData);
      
      if (result.success) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../assets/icon128.png',
          title: 'Password Saved Offline',
          message: `Password for ${passwordData.website} has been saved locally and will sync when the server is available.`,
          priority: 2
        });
        
        return { success: true, offline: true };
      } else {
        throw new Error(result.error || 'Failed to save password locally after server error');
      }
    }} catch (error) {
    console.error('Error saving password:', error);
    
    // Get detailed error message
    const errorMessage = error.message || 'Unknown error';
    
    // Notify user about error with a Chrome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icon128.png',
      title: 'Password Save Failed',
      message: `Could not save password for ${passwordData.website}. Error: ${errorMessage}`,
      priority: 2
    });
    
    // Attempt to save password locally if offline
    if (error.message === 'Failed to fetch') {
      console.log('Network error detected, saving password locally');
      return await savePasswordLocally(passwordData);
    }
    
    // If offline mode or no token, save locally
    if (offlineMode) {
      const result = await savePasswordLocally(passwordData);
      
      if (result.success) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../assets/icon128.png',
          title: 'Password Saved Offline',
          message: `Password for ${passwordData.website} has been saved locally and will sync when you reconnect.`,
          priority: 2
        });
        
        return { success: true, offline: true };
      } else {
        throw new Error(result.error || 'Failed to save password locally');
      }
    }
    
    return { success: false, error: errorMessage };
  }
};

// Save password locally when offline
const savePasswordLocally = async (passwordData) => {
  try {
    // Encrypt the password data
    const encryptedPassword = {
      ...passwordData,
      password: encryptData(passwordData.password),
      savedAt: new Date().toISOString(),
      pendingSync: true
    };
    
    // Get existing passwords
    const existingData = await new Promise((resolve) => {
      chrome.storage.local.get(['offlinePasswords'], (result) => {
        resolve(result.offlinePasswords || []);
      });
    });
    
    // Add new password
    const updatedPasswords = [...existingData, encryptedPassword];
    
    // Save to local storage
    await new Promise((resolve) => {
      chrome.storage.local.set({ offlinePasswords: updatedPasswords }, resolve);
    });
    
    console.log('Password saved locally for later sync');
    return { success: true, offline: true };
  } catch (error) {
    console.error('Error saving password locally:', error);
    return { success: false, error: 'Failed to save locally: ' + error.message };
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
const getAuthToken = async () => {
  try {
    return new Promise(async (resolve) => {
      chrome.storage.local.get(['token'], async (result) => {
        if (result && result.token) {
          console.log('Found auth token');
          
          // Verify the token is still valid by making a validation request
          try {
            const validationResponse = await fetch(`${API_URL}/auth/validate`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${result.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (validationResponse.ok) {
              console.log('Token validated successfully');
              resolve(result.token);
            } else {
              console.warn('Token validation failed, returning null');
              resolve(null);
            }
          } catch (validationError) {
            console.error('Token validation error:', validationError);
            resolve(result.token); // Still return the token as it might be a network error
          }
        } else {
          console.warn('No auth token found in storage');
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper to check server connectivity
const checkServerConnectivity = async () => {
  try {
    const startTime = Date.now();
    console.log('Checking server connectivity at:', new Date().toISOString());
    
    const response = await fetch(`${API_URL}/health`, { 
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      // Set a timeout to avoid hanging for too long
      signal: AbortSignal.timeout(5000)
    });
    
    const endTime = Date.now();
    console.log(`Server response time: ${endTime - startTime}ms`);
    
    if (response.ok) {
      console.log('Server is reachable and healthy');
      
      // Set a flag in storage indicating online status
      chrome.storage.local.set({ serverOnline: true, lastOnlineCheck: Date.now() });
      
      return true;
    } else {
      console.warn('Server returned non-OK status:', response.status);
      chrome.storage.local.set({ serverOnline: false, lastOnlineCheck: Date.now() });
      return false;
    }
  } catch (error) {
    console.error('Server connectivity check failed:', error);
    chrome.storage.local.set({ serverOnline: false, lastOnlineCheck: Date.now() });
    return false;
  }
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

// Start periodic connectivity checks

// Sync passwords saved offline
const syncOfflinePasswords = async () => {
  try {
    // Get offline passwords
    const { offlinePasswords } = await new Promise((resolve) => {
      chrome.storage.local.get(['offlinePasswords'], (result) => {
        resolve(result || { offlinePasswords: [] });
      });
    });
    
    if (!offlinePasswords || offlinePasswords.length === 0) {
      return { success: true, message: 'No offline passwords to sync' };
    }
    
    console.log(`Found ${offlinePasswords.length} offline passwords to sync`);
    
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated for sync' };
    }
    
    // Try to sync each password
    const results = [];
    const remainingPasswords = [];
    
    for (const pwd of offlinePasswords) {
      try {
        const response = await fetch(`${API_URL}/passwords`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pwd)
        });
        
        if (response.ok) {
          results.push({ success: true, password: pwd.website });
        } else {
          remainingPasswords.push(pwd);
          results.push({ success: false, password: pwd.website });
        }
      } catch (error) {
        remainingPasswords.push(pwd);
        results.push({ success: false, password: pwd.website, error: error.message });
      }
    }
    
    // Update offline passwords list
    await new Promise((resolve) => {
      chrome.storage.local.set({ offlinePasswords: remainingPasswords }, resolve);
    });
    
    // Notify if some passwords were synced
    if (results.filter(r => r.success).length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../assets/icon128.png',
        title: 'Passwords Synced',
        message: `${results.filter(r => r.success).length} offline passwords have been synchronized.`,
        priority: 2
      });
    }
    
    return { 
      success: true, 
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      remaining: remainingPasswords.length
    };
  } catch (error) {
    console.error('Error syncing offline passwords:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is authenticated
const checkAuthentication = async () => {
  try {
    const { token, user } = await new Promise((resolve) => {
      chrome.storage.local.get(['token', 'user'], (result) => {
        resolve(result || {});
      });
    });
    
    if (!token) {
      console.warn('No authentication token found');
      return false;
    }
    
    // Try to validate token with server
    const response = await fetch(`${API_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn('Invalid token, logging out');
      // Clear invalid token
      chrome.storage.local.remove(['token', 'user']);
      return false;
    }
    
    console.log('Authentication validated successfully');
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

// Initialize extension
const initialize = () => {
  // Initial sync
  setupSync();
  
  // Check server connectivity
  checkServerConnectivity();
  
  // Set up periodic connectivity checks
  setInterval(() => {
    checkServerConnectivity();
  }, SYNC_INTERVAL);
  
  console.log('Password Manager extension initialized');
};

// Run initialization
initialize();
checkServerConnectivity();
