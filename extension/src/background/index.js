console.log('Background script loaded in index mode');
import { SYNC_INTERVAL } from '../utils/constants';
import { 
  handleGetPasswords, 
  handleSavePassword, 
  handleGetAutofillCredentials, 
  handleRecordPasswordUsage,
  syncOfflinePasswords
} from './password';
import { 
  handleGetFormData, 
  handleSaveFormData 
} from './form';
import { 
  checkServerConnectivity, 
  checkAuthentication 
} from './utils';

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

// Set up periodic sync with server
const setupSync = () => {
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
