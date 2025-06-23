import { API_URL } from '../utils/constants';

// Helper to get auth token from storage
export const getAuthToken = async () => {
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

// Extract domain from URL
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Helper to check server connectivity
export const checkServerConnectivity = async () => {
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

// Check if user is authenticated
export const checkAuthentication = async () => {
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