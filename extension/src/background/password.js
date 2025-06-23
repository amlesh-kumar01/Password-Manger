import { API_URL, FALLBACK_API_URL } from '../utils/constants';
import { encryptData, decryptData } from '../utils/encryption';
import { extractDomain, getAuthToken } from './utils';

// Get passwords for a URL
export const handleGetPasswords = async (url) => {
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

// Save password to server
export const handleSavePassword = async (passwordData) => {
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
    try {
      console.log('Attempting to save password to server with URL:', `${API_URL}/passwords`);
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
    }
  } catch (error) {
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
export const savePasswordLocally = async (passwordData) => {
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
export const handleGetAutofillCredentials = async (urlData) => {
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
export const handleRecordPasswordUsage = async (passwordId, formData) => {
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

// Sync passwords saved offline
export const syncOfflinePasswords = async () => {
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