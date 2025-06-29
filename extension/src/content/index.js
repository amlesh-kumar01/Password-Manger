// Make sure the script runs for pages that are already loaded
// or for single-page applications where DOMContentLoaded may have fired already
console.log('Password Manager Extension: Initial content script execution');
setTimeout(() => {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Password Manager Extension: Document already loaded, initializing immediately');
    initializeFormDetection();
    setupMutationObserver();
  }
}, 100);

// Listen for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Password Manager Extension: Content script loaded');
  
  // Initial setup
  setTimeout(() => {
    initializeFormDetection();
  }, 500);
  
  // Set up mutation observer to detect dynamically added elements
  setupMutationObserver();
});

// Set up mutation observer for dynamic content
const setupMutationObserver = () => {
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // Check if any forms or inputs were added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'FORM' || 
              node.nodeName === 'INPUT' || 
              (node.querySelectorAll && (
                node.querySelectorAll('form').length > 0 || 
                node.querySelectorAll('input').length > 0
              ))) {
            shouldReinitialize = true;
          }
        });
      }
    });
    
    if (shouldReinitialize) {
      console.log('Password Manager Extension: New forms or inputs detected');
      initializeFormDetection();
    }
  });
  
  // Observe the entire document for changes
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  console.log('Password Manager Extension: Mutation observer set up');
};


// Set up global event listeners
const setupGlobalListeners = () => {
  // Remove existing listeners to prevent duplicates
  document.removeEventListener('input', handleGlobalInputChange);
  document.removeEventListener('change', handleGlobalInputChange);
  document.removeEventListener('blur', handleInputBlur, true);
  
  // Add listeners
  document.addEventListener('input', handleGlobalInputChange);
  document.addEventListener('change', handleGlobalInputChange);
  document.addEventListener('blur', handleInputBlur, true);
  
  console.log('Password Manager Extension: Global listeners set up');
};

// Keep track of filled forms and passwords
const filledInputs = new Set();

// Handle input change events globally (detects when a user has manually filled a field)
const handleGlobalInputChange = (event) => {
  const target = event.target;
  
  // Only process input elements
  if (target.tagName !== 'INPUT') return;
  
  // Mark this input as filled by the user
  if (target.value.trim() !== '') {
    filledInputs.add(target);
    
    // If this is a password field, check if we should prompt to save
    if (target.type === 'password') {
      console.log('Password field detected with value');
      // We'll handle this during blur
    }
  } else {
    filledInputs.delete(target);
  }
  
  // Check if this is part of a form we're monitoring
  const form = target.closest('form');
  if (form) {
    checkFormForSaving(form);
  }
};

// Check if a form has enough filled fields to be saved
const checkFormForSaving = (form) => {
  // Skip password-only forms (handled separately)
  if (form.querySelector('input[type="password"]')) {
    return;
  }
  
  const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"])');
  const filledFieldsCount = Array.from(inputs).filter(input => input.value.trim() !== '').length;
  
  // If 3 or more fields are filled, we might want to save this form
  if (filledFieldsCount >= 3 && inputs.length >= 3) {
    const shouldPrompt = !form.dataset.pwmPrompted || form.dataset.pwmPrompted !== 'true';
    
    if (shouldPrompt) {
      promptToSaveForm(form, inputs);
    }
  }
};

// Handle input change events (detects when a user has manually filled a field)
const handleInputChange = (event) => {
  const target = event.target;
  
  // Only process input elements
  if (target.tagName !== 'INPUT') return;
  
  // Mark this input as filled by the user
  if (target.value.trim() !== '') {
    filledInputs.add(target);
  } else {
    filledInputs.delete(target);
  }
};

// Handle input blur events (when user clicks away from an input)
const handleInputBlur = (event) => {
  const target = event.target;
  
  // Only process password inputs when they lose focus
  if (target.tagName === 'INPUT' && target.type === 'password' && target.value.trim() !== '') {
    console.log('Password field blur detected with value');
    
    // Get the containing form or the closest parent element if no form exists
    const form = target.closest('form') || target.parentElement;
    if (!form) return;
    
    // Find username field
    let usernameField = null;
    
    // If we have a form, try to find inputs in the form
    if (form.tagName === 'FORM') {
      const inputs = Array.from(form.querySelectorAll('input'));
      const passwordIndex = inputs.indexOf(target);
      
      if (passwordIndex > 0) {
        // Try to find the username field (usually comes before password)
        for (let i = passwordIndex - 1; i >= 0; i--) {
          const input = inputs[i];
          if ((input.type === 'text' || input.type === 'email')) {
            usernameField = input;
            break;
          }
        }
      }
      
      // If we couldn't find a username field, try other selectors
      if (!usernameField) {
        usernameField = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][id*="user"], input[type="text"][id*="email"]');
      }
    } else {
      // Not in a form, try to find nearby username fields
      const allInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
      for (const input of allInputs) {
        if (input !== target && isNearby(input, target)) {
          usernameField = input;
          break;
        }
      }
    }
    
    // Even if we can't find a username field, still offer to save the password
    // with empty username if site allows it
    usernameField = usernameField || { value: '' };
    
    // Check if we should prompt to save
    promptToSavePassword(form, usernameField, target);
  }
};

// Check if two elements are near each other in the DOM
const isNearby = (elem1, elem2) => {
  const rect1 = elem1.getBoundingClientRect();
  const rect2 = elem2.getBoundingClientRect();
  
  // Check if elements are within reasonable proximity (e.g., same area of the page)
  const horizontalDistance = Math.abs(rect1.left - rect2.left);
  const verticalDistance = Math.abs(rect1.top - rect2.top);
  
  return horizontalDistance < 300 && verticalDistance < 200;
};

// Create a UI notification that prompts the user to save their credentials
const promptToSavePassword = (form, usernameField, passwordField) => {
  // Prevent duplicate prompts
  if (form.dataset.pwmPrompted === 'true') return;
  form.dataset.pwmPrompted = 'true';
  
  console.log('Prompting to save password', {
    username: usernameField.value,
    passwordLength: passwordField.value.length
  });
  
  // Create password data
  const passwordData = {
    website: document.title || window.location.hostname,
    url: window.location.href,
    username: usernameField.value || '',
    password: passwordField.value,
    notes: `Saved from ${window.location.href}`
  };
  
  // Create notification UI
  const notification = document.createElement('div');
  notification.className = 'pwm-save-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #4285F4;">Password Manager Extension</div>
    <div style="margin-bottom: 10px;">Would you like to save this password for ${passwordData.website}?</div>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="pwm-save-no" style="padding: 8px 12px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">No</button>
      <button id="pwm-save-yes" style="padding: 8px 12px; border: none; background: #4285F4; color: white; border-radius: 4px; cursor: pointer;">Save</button>
    </div>
  `;
  
  document.body.appendChild(notification);
    // Add event listeners
  document.getElementById('pwm-save-yes').addEventListener('click', () => {
    // Send to background script
    chrome.runtime.sendMessage({ 
      action: 'savePassword', 
      passwordData 
    }, (response) => {
      if (response && response.success) {
        if (response.offline) {
          showSuccessMessage('Password saved offline. Will sync when connected.');
        } else {
          showSuccessMessage('Password saved successfully!');
        }
      } else {
        const errorMsg = response && response.error 
          ? `Failed to save password: ${response.error}` 
          : 'Failed to save password. Please check your connection.';
        showErrorMessage(errorMsg);
        
        // Log detailed error for debugging
        console.error('Password save error:', response);
      }
    });
    notification.remove();
  });
  
  document.getElementById('pwm-save-no').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 10000);
  
  // Reset the prompt flag after some time to allow for future prompts
  setTimeout(() => {
    if (form && form.dataset) {
      form.dataset.pwmPrompted = 'false';
    }
  }, 300000); // 5 minutes
};

// Show a temporary success message
const showSuccessMessage = (message) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 99999;
    font-family: Arial, sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

// Show a temporary error message
const showErrorMessage = (message) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #F44336;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    font-family: Arial, sans-serif;
    max-width: 400px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: transparent;
    border: none;
    color: white;
    font-size: 14px;
    cursor: pointer;
  `;
  closeButton.textContent = '✕';
  closeButton.addEventListener('click', () => toast.remove());
  toast.appendChild(closeButton);
  
  // Log the error to console as well
  console.error('PassVault Error:', message);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.remove();
    }
  }, 5000);
};

// Detect login forms
const detectLoginForms = () => {
  // Look for all password fields, not just those in forms
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  passwordFields.forEach((passwordField) => {
    console.log('Password field detected:', passwordField);
    
    // Add specific listener to password fields
    if (!passwordField.dataset.pwmPasswordMonitored) {
      passwordField.dataset.pwmPasswordMonitored = 'true';
      
      // Listen for input changes on the password field
      passwordField.addEventListener('input', (e) => {
        if (e.target.value.trim() !== '') {
          console.log('Password field value changed');
        }
      });
      
      // Listen for blur events specifically on password fields
      passwordField.addEventListener('blur', (e) => {
        if (e.target.value.trim() !== '') {
          const form = e.target.closest('form') || e.target.parentElement;
          
          // Find potential username fields
          let usernameField = null;
          
          // Look for nearby username fields
          const possibleUsernameFields = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]');
          
          for (const field of possibleUsernameFields) {
            if (field !== e.target && isNearby(field, e.target) && field.value.trim() !== '') {
              usernameField = field;
              break;
            }
          }
          
          // Even if we can't find a username field, still offer to save
          if (usernameField || confirm('No username detected. Save password with empty username?')) {
            usernameField = usernameField || { value: '' };
            promptToSavePassword(form, usernameField, e.target);
          }
        }
      });
      
      // Add autofill button to password field
      addAutofillButton(passwordField, 'password');
    }
    
    // Try to find the form this password field belongs to
    const form = passwordField.closest('form');
    if (form && !form.dataset.pwmLoginFormDetected) {
      form.dataset.pwmLoginFormDetected = 'true';
      console.log('Login form detected:', form);
      
      // Add form submission listener
      form.addEventListener('submit', handleLoginFormSubmit);
    }
  });
};

// Detect regular forms
const detectForms = () => {
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form) => {
    const inputFields = form.querySelectorAll('input:not([type="password"]):not([type="submit"]):not([type="button"]):not([type="hidden"])');
    
    if (inputFields.length > 2) { // Form with at least 3 input fields
      console.log('Form detected with multiple fields');
      
      // Add autofill button to first text field
      const firstTextField = inputFields[0];
      if (firstTextField) {
        addAutofillButton(firstTextField, 'form');
      }
      
      // Add form submission listener
      form.addEventListener('submit', handleFormSubmit);
    }
  });
};

// Monitor form changes to detect multiple fields being filled
const monitorFormChanges = () => {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Skip if already being monitored
    if (form.dataset.pwmMonitored === 'true') return;
    form.dataset.pwmMonitored = 'true';
    
    console.log('Monitoring form:', form);
    
    // Check inputs when they change
    const inputFields = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"])');
    
    // Set up the change/input listeners for all inputs in the form
    inputFields.forEach(input => {
      input.addEventListener('change', () => checkFormForSaving(form));
      input.addEventListener('input', () => checkFormForSaving(form));
      input.addEventListener('blur', () => checkFormForSaving(form));
    });
  });
};

// Prompt the user to save form data
const promptToSaveForm = (form, inputFields) => {
  // Mark form as prompted
  form.dataset.pwmPrompted = 'true';
  
  // Create form fields data
  const fields = Array.from(inputFields).map(input => ({
    name: input.id || input.name || `field_${Math.random().toString(36).substr(2, 9)}`,
    value: input.value,
    type: input.type,
    sensitive: input.type === 'email' || (input.name && input.name.toLowerCase().includes('email'))
  }));
  
  // Create form data
  const formData = {
    name: `Form for ${document.title || window.location.hostname}`,
    website: document.title || window.location.hostname,
    url: window.location.href,
    fields
  };
  
  // Show prompt after a delay
  setTimeout(() => {
    // Create notification UI
    const notification = document.createElement('div');
    notification.className = 'pwm-save-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 99999;
      font-family: Arial, sans-serif;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #4285F4;">Password Manager Extension</div>
      <div style="margin-bottom: 10px;">Would you like to save this form data for ${formData.website}?</div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="pwm-save-form-no" style="padding: 8px 12px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">No</button>
        <button id="pwm-save-form-yes" style="padding: 8px 12px; border: none; background: #4285F4; color: white; border-radius: 4px; cursor: pointer;">Save</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listeners
    document.getElementById('pwm-save-form-yes').addEventListener('click', () => {
      // Send to background script
      chrome.runtime.sendMessage({ 
        action: 'saveFormData', 
        formData 
      }, (response) => {
        if (response && response.success) {
          showSuccessMessage('Form data saved successfully!');
        } else {
          showErrorMessage('Failed to save form data.');
        }
      });
      notification.remove();
    });
    
    document.getElementById('pwm-save-form-no').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 10000);
  }, 500);
};

// Add autofill button next to an input field
const addAutofillButton = (inputField, type) => {
  // Check if button already exists
  const existingButton = inputField.parentNode.querySelector('.pwm-autofill-btn');
  if (existingButton) {
    return;
  }
  
  // Create button
  const button = document.createElement('button');
  button.className = 'pwm-autofill-btn';
  button.textContent = '🔑';
  button.title = type === 'password' ? 'Autofill password' : 'Autofill form';
  button.style.cssText = `
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    z-index: 9999;
  `;
  
  // Position the button
  const inputPosition = inputField.getBoundingClientRect();
  const parentPosition = inputField.parentNode.getBoundingClientRect();
  
  // Make parent position relative if it's not already
  if (getComputedStyle(inputField.parentNode).position === 'static') {
    inputField.parentNode.style.position = 'relative';
  }
  
  // Add click event listener
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'password') {
      handlePasswordAutofill(inputField);
    } else {
      handleFormAutofill(inputField.form);
    }
  });
  
  // Add button to DOM
  inputField.parentNode.appendChild(button);
};

// Handle password autofill button click
const handlePasswordAutofill = (passwordField) => {
  // Get current URL
  const url = window.location.href;
  
  // Request passwords from background script
  chrome.runtime.sendMessage({ action: 'getPasswords', url }, (response) => {
    if (response.success && response.passwords && response.passwords.length > 0) {
      // For simplicity, just use the first password
      // In a real extension, we'd show a dropdown with all matching passwords
      const passwordData = response.passwords[0];
      
      // Find username field (usually the input before the password field)
      let usernameField = null;
      const inputs = Array.from(passwordField.form.querySelectorAll('input'));
      const passwordIndex = inputs.indexOf(passwordField);
      
      if (passwordIndex > 0) {
        // Try to find the username field (usually comes before password)
        for (let i = passwordIndex - 1; i >= 0; i--) {
          const input = inputs[i];
          if (input.type === 'text' || input.type === 'email') {
            usernameField = input;
            break;
          }
        }
      }
      
      // Fill in the fields
      if (usernameField) {
        usernameField.value = passwordData.username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      passwordField.value = passwordData.password;
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('Password autofilled');
    } else {
      console.log('No passwords found for this site');
    }
  });
};

// Handle form autofill button click
const handleFormAutofill = (form) => {
  // Get current URL
  const url = window.location.href;
  
  // Request form data from background script
  chrome.runtime.sendMessage({ action: 'getFormData', url }, (response) => {
    if (response.success && response.formData && response.formData.length > 0) {
      // For simplicity, just use the first form profile
      // In a real extension, we'd show a dropdown with all matching profiles
      const formProfile = response.formData[0];
      
      // Fill in form fields
      formProfile.fields.forEach((field) => {
        // Try to find matching field
        let inputField = null;
        
        // Try matching by id
        inputField = form.querySelector(`#${field.name}`);
        
        // Try matching by name
        if (!inputField) {
          inputField = form.querySelector(`[name="${field.name}"]`);
        }
        
        // Try matching by common form field patterns
        if (!inputField && field.name.toLowerCase().includes('email')) {
          inputField = form.querySelector('input[type="email"]');
        }
        
        // Fill in the field if found
        if (inputField) {
          inputField.value = field.value;
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      console.log('Form autofilled');
    } else {
      console.log('No form profiles found for this site');
    }
  });
};

// Handle login form submission
const handleLoginFormSubmit = (event) => {
  // No longer needed as we handle password saving on blur
  // The form will be marked as prompted in the blur handler
  // This handler remains for backwards compatibility
};

// Handle regular form submission
const handleFormSubmit = (event) => {
  // Get form data
  const form = event.target;
  const inputFields = form.querySelectorAll('input:not([type="password"]):not([type="submit"]):not([type="button"]):not([type="hidden"])');
  
  if (inputFields.length < 3) return;
  
  // Create form fields data
  const fields = Array.from(inputFields).map(input => ({
    name: input.id || input.name || `field_${Math.random().toString(36).substr(2, 9)}`,
    value: input.value,
    type: input.type,
    sensitive: input.type === 'email' || input.name?.toLowerCase().includes('email')
  }));
  
  // Create form data
  const formData = {
    name: `Form for ${document.title || window.location.hostname}`,
    website: document.title || window.location.hostname,
    url: window.location.href,
    fields
  };
  
  // Create notification UI
  const notification = document.createElement('div');
  notification.className = 'pwm-save-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 99999;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #4285F4;">Password Manager Extension</div>
    <div style="margin-bottom: 10px;">Would you like to save this form data for ${formData.website}?</div>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="pwm-save-form-no" style="padding: 8px 12px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">No</button>
      <button id="pwm-save-form-yes" style="padding: 8px 12px; border: none; background: #4285F4; color: white; border-radius: 4px; cursor: pointer;">Save</button>
    </div>
  `;
  
  setTimeout(() => {
    document.body.appendChild(notification);
    
    // Add event listeners
    document.getElementById('pwm-save-form-yes').addEventListener('click', () => {
      // Send to background script
      chrome.runtime.sendMessage({ 
        action: 'saveFormData', 
        formData 
      }, (response) => {
        if (response && response.success) {
          showSuccessMessage('Form data saved successfully!');
        } else {
          showErrorMessage('Failed to save form data.');
        }
      });
      notification.remove();
    });
    
    document.getElementById('pwm-save-form-no').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 10000);
  }, 500);
};

// Initialize all form detection features
const initializeFormDetection = () => {
  // Detect login forms
  detectLoginForms();
  
  // Detect regular forms
  detectForms();
  
  // Monitor forms for changes
  monitorFormChanges();
  
  // Listen for password and form input changes
  setupGlobalListeners();
}
// Debug helper function
const debugLog = (message, data = null) => {
  const DEBUG = true; // Set to false in production
  if (DEBUG) {
    if (data) {
      console.log(`[PWM Debug] ${message}`, data);
    } else {
      console.log(`[PWM Debug] ${message}`);
    }
  }
};

// Check if extension is loaded correctly
debugLog('Password Manager Extension loaded successfully');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('Message received in content script', message);
  
  if (message.action === 'checkPasswordDetection') {
    // Report all password fields on the page
    const passwordFields = document.querySelectorAll('input[type="password"]');
    sendResponse({
      success: true,
      found: passwordFields.length > 0,
      count: passwordFields.length,
      details: Array.from(passwordFields).map(field => ({
        id: field.id,
        name: field.name,
        hasValue: field.value.trim() !== '',
        visible: isVisible(field)
      }))
    });
    return true;
  }
  
  // Default response
  sendResponse({ success: true, message: 'Content script is active' });
  return true;
});

// Check if an element is visible
const isVisible = (element) => {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetWidth > 0 && element.offsetHeight > 0;
};
