console.log('Password Manager background script loaded');

// Simple synchronous imports instead of ES module imports
const SYNC_INTERVAL =  1000; 

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.action);
  
  if (message.action === 'getPasswords') {
    handleGetPasswords(message.url)
      .then(result => {
        console.log('Password retrieval result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Password retrieval error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }
  
  if (message.action === 'getFormData') {
    handleGetFormData(message.url)
      .then(result => {
        console.log('Form data retrieval result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Form data retrieval error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.action === 'saveFormData') {
    handleSaveFormData(message.formData)
      .then(result => {
        console.log('Form data save result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Form data save error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.action === 'savePassword') {
    handleSavePassword(message.passwordData)
      .then(result => {
        console.log('Password save result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Password save error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.action === 'getAutofillCredentials') {
    handleGetAutofillCredentials(message.urlData)
      .then(result => {
        console.log('Autofill credentials result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Autofill credentials error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.action === 'recordPasswordUsage') {
    handleRecordPasswordUsage(message.passwordId, message.formData)
      .then(result => {
        console.log('Password usage record result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Password usage record error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Default response for unknown actions
  console.warn('Unknown message action:', message.action);
  sendResponse({ success: false, error: `Unknown action: ${message.action}` });
  return false;
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Password & Form Manager extension installed');
});

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
          
          // If password fields are found, update the extension icon or badge
          if (response.found) {
            chrome.action.setBadgeText({ tabId, text: response.count.toString() });
            chrome.action.setBadgeBackgroundColor({ tabId, color: '#4285F4' });
          }
        }
      });
    }, 1000);
  }
});

// Now implement the handler functions that were previously imported
// These are simplified versions of your handler functions

// Password handlers
async function handleGetPasswords(url) {
  try {
    console.log('Getting passwords for:', url);
    // Get stored passwords from Chrome storage
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['passwords'], (result) => {
        resolve(result.passwords || []);
      });
    });
    
    // Filter passwords for the current domain
    const domain = extractDomain(url);
    const filteredPasswords = result.filter(pwd => 
      extractDomain(pwd.url) === domain || pwd.website === domain
    );
    
    return { success: true, passwords: filteredPasswords };
  } catch (error) {
    console.error('Error getting passwords:', error);
    return { success: false, error: error.message };
  }
}

async function handleSavePassword(passwordData) {
  try {
    console.log('Saving password for:', passwordData.website);
    
    // Add timestamp and ID
    const newPassword = {
      ...passwordData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Get existing passwords
    const { passwords = [] } = await new Promise((resolve) => {
      chrome.storage.local.get(['passwords'], (result) => {
        resolve(result);
      });
    });
    
    // Add new password
    const updatedPasswords = [...passwords, newPassword];
    
    // Save back to storage
    await new Promise((resolve) => {
      chrome.storage.local.set({ passwords: updatedPasswords }, resolve);
    });
    
    return { success: true, password: newPassword };
  } catch (error) {
    console.error('Error saving password:', error);
    return { success: false, error: error.message };
  }
}

async function handleGetAutofillCredentials(urlData) {
  try {
    const domain = extractDomain(urlData.url);
    console.log('Getting autofill credentials for:', domain);
    
    // Get stored passwords
    const { passwords = [] } = await new Promise((resolve) => {
      chrome.storage.local.get(['passwords'], (result) => {
        resolve(result);
      });
    });
    
    // Filter passwords for the current domain
    const filteredPasswords = passwords.filter(pwd => 
      extractDomain(pwd.url) === domain || pwd.website === domain
    );
    
    return { success: true, passwords: filteredPasswords };
  } catch (error) {
    console.error('Error getting autofill credentials:', error);
    return { success: false, error: error.message };
  }
}

async function handleRecordPasswordUsage(passwordId, formData) {
  try {
    console.log('Recording password usage for ID:', passwordId);
    
    // Get stored passwords
    const { passwords = [] } = await new Promise((resolve) => {
      chrome.storage.local.get(['passwords'], (result) => {
        resolve(result);
      });
    });
    
    // Update the usage timestamp for the specified password
    const updatedPasswords = passwords.map(pwd => {
      if (pwd.id === passwordId) {
        return {
          ...pwd,
          lastUsed: new Date().toISOString(),
          useCount: (pwd.useCount || 0) + 1
        };
      }
      return pwd;
    });
    
    // Save back to storage
    await new Promise((resolve) => {
      chrome.storage.local.set({ passwords: updatedPasswords }, resolve);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error recording password usage:', error);
    return { success: false, error: error.message };
  }
}

async function syncOfflinePasswords() {
  // This is a placeholder for syncing with your backend
  console.log('Syncing offline passwords...');
  return { success: true, message: 'Sync completed' };
}

// Form data handlers
async function handleGetFormData(url) {
  try {
    console.log('Getting form data for:', url);
    
    // Get stored form data
    const { formData = [] } = await new Promise((resolve) => {
      chrome.storage.local.get(['formData'], (result) => {
        resolve(result);
      });
    });
    
    // Filter form data for the current domain
    const domain = extractDomain(url);
    const filteredFormData = formData.filter(form => 
      extractDomain(form.url) === domain || form.website === domain
    );
    
    return { success: true, formData: filteredFormData };
  } catch (error) {
    console.error('Error getting form data:', error);
    return { success: false, error: error.message };
  }
}

async function handleSaveFormData(formData) {
  try {
    console.log('Saving form data for:', formData.website);
    
    // Add timestamp and ID
    const newFormData = {
      ...formData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Get existing form data
    const { formData: storedFormData = [] } = await new Promise((resolve) => {
      chrome.storage.local.get(['formData'], (result) => {
        resolve(result);
      });
    });
    
    // Add new form data
    const updatedFormData = [...storedFormData, newFormData];
    
    // Save back to storage
    await new Promise((resolve) => {
      chrome.storage.local.set({ formData: updatedFormData }, resolve);
    });
    
    return { success: true, formData: newFormData };
  } catch (error) {
    console.error('Error saving form data:', error);
    return { success: false, error: error.message };
  }
}

// Utility functions
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function checkServerConnectivity() {
  console.log('Checking server connectivity...');
  // This is a placeholder for checking connectivity with your backend
  return true;
}

// Set up periodic sync with server
function setupSync() {
  const syncData = async () => {
    try {
      // Try to sync offline passwords
      await syncOfflinePasswords();
      
      console.log('Syncing data with server completed');
    } catch (error) {
      console.error('Sync error:', error);
    }
  };
  
  // Initial sync
  syncData();
  
  // Setup interval
  setInterval(syncData, SYNC_INTERVAL);
}

// Initialize extension
function initialize() {
  // Initial sync
  setupSync();
  
  // Check server connectivity
  checkServerConnectivity();
  
  // Set up periodic connectivity checks
  setInterval(() => {
    checkServerConnectivity();
  }, SYNC_INTERVAL);
  
  console.log('Password Manager extension initialized');
}

// Run initialization
initialize();

// Set up a heartbeat to verify the background script is running
setInterval(() => {
  console.log('Background script heartbeat -', new Date().toISOString());
}, 60000); // Log every minute