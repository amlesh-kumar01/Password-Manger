// Listen for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  // Detect login forms
  detectLoginForms();
  
  // Detect regular forms
  detectForms();
  
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
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

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
  // Get form data
  const form = event.target;
  const passwordField = form.querySelector('input[type="password"]');
  
  if (!passwordField) return;
  
  // Find username field
  let usernameField = null;
  const inputs = Array.from(form.querySelectorAll('input'));
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
  
  if (!usernameField) return;
  
  // Create password data
  const passwordData = {
    website: document.title || window.location.hostname,
    url: window.location.href,
    username: usernameField.value,
    password: passwordField.value,
    notes: `Saved from ${window.location.href}`
  };
  
  // Ask user if they want to save the password
  // In a real extension, we'd show a UI prompt
  setTimeout(() => {
    const savePw = confirm('Do you want to save this password?');
    
    if (savePw) {
      // Send to background script
      chrome.runtime.sendMessage({ 
        action: 'savePassword', 
        passwordData 
      });
    }
  }, 500);
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
  
  // Ask user if they want to save the form data
  // In a real extension, we'd show a UI prompt
  setTimeout(() => {
    const saveForm = confirm('Do you want to save this form data for future use?');
    
    if (saveForm) {
      // Send to background script
      chrome.runtime.sendMessage({ 
        action: 'saveFormData', 
        formData 
      });
    }
  }, 500);
};
