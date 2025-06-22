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
