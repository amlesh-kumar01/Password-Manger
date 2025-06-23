console.log('Testing background script loaded successfully');

// Simple message listener for testing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in test background script:', message);
  
  // Send a simple response back
  sendResponse({ 
    success: true, 
    message: 'Test background script received your message', 
    receivedAction: message.action 
  });
  
  return true; // Required for async response
});

// Simple heartbeat to verify the script is running
setInterval(() => {
  console.log('Test background script heartbeat -', new Date().toISOString());
}, 60000); //