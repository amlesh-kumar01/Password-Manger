// Monitor form changes to detect multiple fields being filled
const monitorFormChanges = () => {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Skip if already being monitored
    if (form.dataset.pwmMonitored === 'true') return;
    form.dataset.pwmMonitored = 'true';
    
    // Store form metadata for better future matching
    const formId = form.id || '';
    const formAction = form.action || '';
    const formMethod = form.method || '';
    
    // Check inputs when they change
    const inputFields = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"])');
    let filledCount = 0;
    
    // Check if this is a login form
    const passwordFields = form.querySelectorAll('input[type="password"]');
    const isLoginForm = passwordFields.length > 0;
    
    // If it's a login form, try to offer autofill
    if (isLoginForm && !form.dataset.pwmAutofillAttempted) {
      form.dataset.pwmAutofillAttempted = 'true';
      tryAutofillLoginForm(form, passwordFields);
    }
    
    inputFields.forEach(input => {
      input.addEventListener('change', () => {
        if (input.value.trim() !== '') {
          filledCount++;
          
          // Handle login forms separately
          if (isLoginForm) {
            // Track username and password field for potential saving
            if (input.type === 'password') {
              input.dataset.pwmIsPassword = 'true';
            } else if (!input.dataset.pwmIsUsername) {
              // Try to identify username fields
              const fieldName = input.name?.toLowerCase() || '';
              const fieldId = input.id?.toLowerCase() || '';
              const fieldType = input.type;
              
              if (fieldType === 'email' || 
                  fieldName.includes('email') || 
                  fieldId.includes('email') ||
                  fieldName.includes('user') || 
                  fieldId.includes('user') ||
                  fieldName.includes('login') || 
                  fieldId.includes('login')) {
                input.dataset.pwmIsUsername = 'true';
                input.dataset.pwmUsernameType = fieldType === 'email' || 
                                               fieldName.includes('email') || 
                                               fieldId.includes('email') 
                                               ? 'email' : 'username';
              }
            }
          } 
          // For non-login forms with many fields
          else if (filledCount >= 3 && inputFields.length >= 3) {
            // This might be a form worth saving
            const shouldPrompt = !form.dataset.pwmPrompted || form.dataset.pwmPrompted !== 'true';
            
            if (shouldPrompt) {
              promptToSaveForm(form, inputFields, { formId, formAction, formMethod });
            }
          }
        }
      });
    });
  });
};

// Prompt the user to save form data
const promptToSaveForm = (form, inputFields, formMetadata = {}) => {
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
    formId: formMetadata.formId || '',
    formAction: formMetadata.formAction || '',
    formMethod: formMetadata.formMethod || '',
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

// Try to autofill a login form with saved credentials
const tryAutofillLoginForm = (form, passwordFields) => {
  // Extract form information for matching
  const formId = form.id || '';
  const formAction = form.action || '';
  
  // Check if the form has login-related indicators
  const isDefinitelyLoginForm = 
    formAction.includes('login') || 
    formAction.includes('signin') || 
    formAction.includes('auth') ||
    form.id?.toLowerCase().includes('login') || 
    form.className?.toLowerCase().includes('login');
  
  // Only auto-prompt for definite login forms
  if (!isDefinitelyLoginForm) return;
  
  // Find potential username fields
  const potentialUsernameFields = Array.from(form.querySelectorAll('input[type="text"], input[type="email"]'))
    .filter(input => {
      const name = input.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';
      return name.includes('user') || 
             name.includes('email') || 
             name.includes('login') ||
             id.includes('user') || 
             id.includes('email') || 
             id.includes('login');
    });
  
  if (potentialUsernameFields.length === 0 && passwordFields.length === 0) return;
  
  // Collect field information for better matching
  const inputFields = Array.from(form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"])'))
    .map(input => ({
      name: input.name || '',
      id: input.id || '',
      type: input.type || ''
    }));
  
  // Send request to get matching credentials
  chrome.runtime.sendMessage({
    action: 'getAutofillCredentials',
    urlData: {
      url: window.location.href,
      formId,
      formAction,
      inputFields
    }
  }, (response) => {
    if (response && response.success && response.passwords && response.passwords.length > 0) {
      // Show autofill options
      showAutofillOptions(form, potentialUsernameFields[0], passwordFields[0], response.passwords);
    }
  });
};

// Show autofill options for the user to choose from
const showAutofillOptions = (form, usernameField, passwordField, passwords) => {
  if (!usernameField || !passwordField || passwords.length === 0) return;
  
  // Create dropdown UI
  const dropdown = document.createElement('div');
  dropdown.className = 'pwm-autofill-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: ${usernameField.getBoundingClientRect().bottom + window.scrollY + 5}px;
    left: ${usernameField.getBoundingClientRect().left + window.scrollX}px;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  
  let dropdownHTML = `
    <div style="padding: 8px 16px; font-weight: bold; color: #4285F4; border-bottom: 1px solid #eee;">
      Saved Passwords
    </div>
  `;
  
  // Add each password option
  passwords.forEach((pwd, index) => {
    dropdownHTML += `
      <div class="pwm-autofill-option" data-index="${index}" style="padding: 8px 16px; cursor: pointer; display: flex; align-items: center;">
        <div style="margin-right: 8px;">🔑</div>
        <div>
          <div style="font-weight: bold;">${pwd.username}</div>
          <div style="font-size: 12px; color: #666;">${pwd.website}</div>
        </div>
      </div>
    `;
  });
  
  dropdown.innerHTML = dropdownHTML;
  document.body.appendChild(dropdown);
  
  // Add click handlers
  dropdown.querySelectorAll('.pwm-autofill-option').forEach(option => {
    option.addEventListener('click', () => {
      const index = parseInt(option.dataset.index);
      const selectedPassword = passwords[index];
      
      // Fill the form
      usernameField.value = selectedPassword.username;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordField.value = selectedPassword.password;
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Remove dropdown
      dropdown.remove();
      
      // Record usage
      chrome.runtime.sendMessage({
        action: 'recordPasswordUsage',
        passwordId: selectedPassword._id,
        formData: {
          formId: form.id || '',
          formAction: form.action || '',
          usernameField: usernameField.name || usernameField.id || '',
          passwordField: passwordField.name || passwordField.id || ''
        }
      });
    });
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(dropdown)) {
      dropdown.remove();
    }
  }, 10000);
  
  // Add click outside to close
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && document.body.contains(dropdown)) {
      dropdown.remove();
    }
  });
};
