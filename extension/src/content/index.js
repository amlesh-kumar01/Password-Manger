// Listen for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  // Detect login forms
  detectLoginForms();
  
  // Detect regular forms
  detectForms();
  
  // Monitor forms for changes
  monitorFormChanges();
  
  // Add mutation observer to detect dynamically added forms
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // Check if any forms were added
        let formsAdded = false;
        
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'FORM') {
            formsAdded = true;
          } else if (node.querySelectorAll) {
            const forms = node.querySelectorAll('form');
            if (forms.length > 0) {
              formsAdded = true;
            }
          }
        });
        
        if (formsAdded) {
          detectLoginForms();
          detectForms();
          monitorFormChanges();
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Listen for password and form input changes
  document.addEventListener('change', handleInputChange);
  document.addEventListener('blur', handleInputBlur, true);
});

// Keep track of filled forms and passwords
const filledInputs = new Set();

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
    // Check if this is part of a login form
    const form = target.closest('form');
    if (!form) return;
    
    // Find username field
    let usernameField = null;
    const inputs = Array.from(form.querySelectorAll('input'));
    const passwordIndex = inputs.indexOf(target);
    
    if (passwordIndex > 0) {
      // Try to find the username field (usually comes before password)
      for (let i = passwordIndex - 1; i >= 0; i--) {
        const input = inputs[i];
        if ((input.type === 'text' || input.type === 'email') && input.value.trim() !== '') {
          usernameField = input;
          break;
        }
      }
    }
    
    if (!usernameField) return;
    
    // Check if we should prompt to save
    promptToSavePassword(form, usernameField, target);
  }
};

// Create a UI notification that prompts the user to save their credentials
const promptToSavePassword = (form, usernameField, passwordField) => {
  // Prevent duplicate prompts
  if (form.dataset.pwmPrompted === 'true') return;
  form.dataset.pwmPrompted = 'true';
  
  // Create password data
  const passwordData = {
    website: document.title || window.location.hostname,
    url: window.location.href,
    username: usernameField.value,
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
    z-index: 99999;
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
        showSuccessMessage('Password saved successfully!');
      } else {
        showErrorMessage('Failed to save password.');
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
    z-index: 99999;
    font-family: Arial, sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

// Detect login forms
const detectLoginForms = () => {
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form) => {
    const passwordFields = form.querySelectorAll('input[type="password"]');
    
    if (passwordFields.length > 0) {
      const isLoginForm = true; // More sophisticated detection would be done in a real extension
      
      if (isLoginForm) {
        console.log('Login form detected');
        
        // Add autofill button to password field
        passwordFields.forEach((passwordField) => {
          addAutofillButton(passwordField, 'password');
        });
        
        // Add form submission listener
        form.addEventListener('submit', handleLoginFormSubmit);
      }
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
    
    // Check inputs when they change
    const inputFields = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"])');
    let filledCount = 0;
    
    inputFields.forEach(input => {
      input.addEventListener('change', () => {
        if (input.value.trim() !== '') {
          filledCount++;
          
          // If 3 or more fields are filled and this is not a login form (no password field)
          if (filledCount >= 3 && !form.querySelector('input[type="password"]') && inputFields.length >= 3) {
            // This might be a form worth saving
            const shouldPrompt = !form.dataset.pwmPrompted || form.dataset.pwmPrompted !== 'true';
            
            if (shouldPrompt) {
              promptToSaveForm(form, inputFields);
            }
          }
        }
      });
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
