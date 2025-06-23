import mongoose from 'mongoose';

const PasswordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  website: {
    type: String,
    required: true
  },  url: {
    type: String
  },
  urlPatterns: [{
    type: String
  }], // Additional URL patterns to match for auto-fill (e.g., subdomains)
  domainOnly: {
    type: Boolean,
    default: true // If true, match only the domain, not the full URL
  },  username: {
    type: String,
    required: true
  },
  usernameType: {
    type: String,
    enum: ['email', 'username', 'phone', 'other'],
    default: 'email'
  },
  usernameField: {
    type: String,
    default: '' // Stores the actual field name from the form (e.g., 'user_email', 'login', etc.)
  },
  password: {
    type: String,
    required: true
  },
  passwordField: {
    type: String,
    default: '' // Stores the actual password field name from the form
  },
  passwordStrength: {
    type: Number,
    default: 0, // 0-100 scale for password strength
    min: 0,
    max: 100
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessLevel: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastSynced: {
    type: Date,
    default: Date.now
  },
  deviceIds: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['personal', 'work', 'finance', 'social', 'other'],
    default: 'personal'
  },
  notes: {
    type: String
  },  createdAt: {
    type: Date,
    default: Date.now
  },  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  },
  useCount: {
    type: Number,
    default: 0
  },
  formData: {
    formId: String,
    formAction: String,
    additionalFields: [{
      name: String,
      value: String,
      type: String
    }]
  },
  version: {
    type: Number,
    default: 1
  },
  exportHistory: [{
    exportedAt: {
      type: Date
    },
    exportFormat: {
      type: String,
      enum: ['csv', 'json', 'xml', 'encrypted']
    }
  }],
  importSource: {
    type: String
  }
});

// Pre-save hook to update updatedAt and version
PasswordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Increment version for tracking changes across devices
  if (this.isModified('password') || this.isModified('username') || 
      this.isModified('website') || this.isModified('url') ||
      this.isModified('formData') || this.isModified('usernameField') ||
      this.isModified('passwordField')) {
    this.version += 1;
  }
  
  // Calculate password strength if password is modified
  if (this.isModified('password')) {
    this.passwordStrength = calculatePasswordStrength(this.password);
  }
  
  // Add URL patterns if we have a URL but no patterns
  if (this.isModified('url') && this.url && (!this.urlPatterns || this.urlPatterns.length === 0)) {
    try {
      const urlObj = new URL(this.url);
      // Add the domain without subdomain as a pattern
      const domain = urlObj.hostname.split('.');
      if (domain.length > 2) {
        const mainDomain = domain.slice(domain.length - 2).join('.');
        this.urlPatterns = [`*.${mainDomain}`];
      }
    } catch (error) {
      // Ignore URL parsing errors
    }
  }
  
  next();
});

// Method to calculate password strength
function calculatePasswordStrength(password) {
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength += 10; // lowercase letters
  if (/[A-Z]/.test(password)) strength += 15; // uppercase letters
  if (/[0-9]/.test(password)) strength += 15; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20; // special characters
  
  // Pattern checks (penalize common patterns)
  if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) strength -= 10;
  if (/123/.test(password) || /abc/i.test(password)) strength -= 5;
  
  // Ensure strength is between 0-100
  return Math.max(0, Math.min(100, strength));
}

// Static method to handle importing passwords in bulk
PasswordSchema.statics.importFromFile = async function(userId, data, format) {
  try {
    let passwordsToImport = [];
    
    // Parse data based on format
    if (format === 'json') {
      passwordsToImport = JSON.parse(data);
    } else if (format === 'csv') {
      // CSV parsing logic would go here
      // This is a simplified example
      const rows = data.split('\n');
      const headers = rows[0].split(',');
      
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',');
        const passwordObj = {};
        
        headers.forEach((header, index) => {
          passwordObj[header.trim()] = values[index]?.trim();
        });
        
        passwordsToImport.push(passwordObj);
      }
    }
    
    // Add userId and metadata to each password
    const enrichedPasswords = passwordsToImport.map(pwd => ({
      ...pwd,
      userId,
      importSource: format,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      passwordStrength: calculatePasswordStrength(pwd.password || '')
    }));
    
    // Insert all passwords
    return await this.insertMany(enrichedPasswords);
  } catch (error) {
    throw new Error(`Import failed: ${error.message}`);
  }
};

// Instance method to export password data
PasswordSchema.methods.prepareForExport = function(format = 'json') {
  // Create a sanitized object for export
  const exportData = {
    website: this.website,
    url: this.url,
    username: this.username,
    password: this.password,
    notes: this.notes,
    category: this.category,
    exportedAt: new Date()
  };
  
  // Update export history
  this.exportHistory.push({
    exportedAt: new Date(),
    exportFormat: format
  });
  
  // Convert to requested format
  if (format === 'json') {
    return JSON.stringify(exportData);
  } else if (format === 'csv') {
    const headers = Object.keys(exportData).join(',');
    const values = Object.values(exportData).map(val => `"${val}"`).join(',');
    return `${headers}\n${values}`;
  }
  
  return exportData;
};

// Method to handle sync conflicts
PasswordSchema.methods.resolveConflict = function(incomingPassword) {
  // If incoming version is newer, update fields
  if (incomingPassword.version > this.version) {
    this.website = incomingPassword.website;
    this.url = incomingPassword.url;
    this.username = incomingPassword.username;
    this.password = incomingPassword.password;
    this.notes = incomingPassword.notes;
    this.category = incomingPassword.category;
    this.version = incomingPassword.version;
    return true;
  }
  return false;
};

// Method to check if a URL matches this password record
PasswordSchema.methods.matchesUrl = function(testUrl) {
  try {
    // Parse URLs
    const storedUrl = new URL(this.url);
    const incomingUrl = new URL(testUrl);
    
    // Domain-only matching
    if (this.domainOnly) {
      return storedUrl.hostname === incomingUrl.hostname;
    }
    
    // Check exact URL match
    if (this.url === testUrl) {
      return true;
    }
    
    // Check additional URL patterns
    if (this.urlPatterns && this.urlPatterns.length > 0) {
      return this.urlPatterns.some(pattern => {
        // Simple wildcard pattern matching
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*') + '$'
        );
        return regex.test(testUrl);
      });
    }
    
    return false;
  } catch (error) {
    // If URL parsing fails, do a simple includes check
    return this.url.includes(testUrl) || testUrl.includes(this.url);
  }
};

// Method to update usage statistics
PasswordSchema.methods.recordUsage = function() {
  this.lastUsed = new Date();
  this.useCount += 1;
  return this.save();
};

// Static method to find the best password for a given URL
PasswordSchema.statics.findBestMatch = async function(userId, url, formData = null) {
  // First try exact matches
  let matches = await this.find({
    userId,
    $or: [
      { url: url },
      { urlPatterns: url },
      { website: new URL(url).hostname }
    ]
  }).sort({ lastUsed: -1, useCount: -1 });
  
  if (matches.length > 0) {
    return matches;
  }
  
  // Try domain matching
  try {
    const domain = new URL(url).hostname;
    return await this.find({
      userId,
      $or: [
        { website: domain },
        { website: domain.replace('www.', '') },
        { domainOnly: true, url: { $regex: domain } }
      ]
    }).sort({ lastUsed: -1, useCount: -1 });
  } catch (error) {
    return [];
  }
};

// Method to extract form information for better future matching
PasswordSchema.methods.updateFormData = function(formInfo) {
  if (!this.formData) {
    this.formData = {
      additionalFields: []
    };
  }
  
  if (formInfo.formId) {
    this.formData.formId = formInfo.formId;
  }
  
  if (formInfo.formAction) {
    this.formData.formAction = formInfo.formAction;
  }
  
  if (formInfo.usernameField) {
    this.usernameField = formInfo.usernameField;
  }
  
  if (formInfo.passwordField) {
    this.passwordField = formInfo.passwordField;
  }
  
  // Update username type if we can detect it
  if (formInfo.usernameField) {
    if (formInfo.usernameField.toLowerCase().includes('email')) {
      this.usernameType = 'email';
    } else if (formInfo.usernameField.toLowerCase().includes('phone')) {
      this.usernameType = 'phone';
    } else if (formInfo.usernameField.toLowerCase().includes('user')) {
      this.usernameType = 'username';
    }
  }
  
  // Add any additional fields that might be useful for autofill
  if (formInfo.additionalFields && Array.isArray(formInfo.additionalFields)) {
    // Merge new fields with existing ones, avoiding duplicates
    const existingFieldNames = this.formData.additionalFields.map(f => f.name);
    
    formInfo.additionalFields.forEach(field => {
      if (!existingFieldNames.includes(field.name)) {
        this.formData.additionalFields.push(field);
      }
    });
  }
  
  return this.save();
};

// Add query helpers for better search
PasswordSchema.query.byDomain = function(domain) {
  return this.where({ 
    $or: [
      { website: domain },
      { website: domain.replace('www.', '') },
      { urlPatterns: { $regex: domain } }
    ] 
  });
};

PasswordSchema.query.byForm = function(formId) {
  return this.where({ 'formData.formId': formId });
};

PasswordSchema.query.mostUsed = function() {
  return this.sort({ useCount: -1 });
};

PasswordSchema.query.recentlyUsed = function() {
  return this.sort({ lastUsed: -1 });
};

// Static method to find credentials for auto-fill with advanced matching
PasswordSchema.statics.findForAutofill = async function(userId, urlData) {
  const { url, formId, formAction, inputFields } = urlData;
  
  let query = this.find({ userId });
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // First, try to find by form ID if available (most specific)
    if (formId) {
      const formMatches = await this.find({ userId, 'formData.formId': formId })
        .sort({ lastUsed: -1, useCount: -1 })
        .limit(5);
      
      if (formMatches.length > 0) {
        return formMatches;
      }
    }
    
    // Then by form action if available
    if (formAction) {
      const actionMatches = await this.find({ userId, 'formData.formAction': formAction })
        .sort({ lastUsed: -1, useCount: -1 })
        .limit(5);
      
      if (actionMatches.length > 0) {
        return actionMatches;
      }
    }
    
    // Then try field names if provided
    if (inputFields && inputFields.length > 0) {
      const fieldNames = inputFields.map(f => f.name || f.id);
      
      const fieldMatches = await this.find({
        userId,
        $or: [
          { usernameField: { $in: fieldNames } },
          { passwordField: { $in: fieldNames } }
        ]
      }).sort({ lastUsed: -1, useCount: -1 }).limit(5);
      
      if (fieldMatches.length > 0) {
        return fieldMatches;
      }
    }
    
    // Finally, try URL and domain matching
    return await this.findBestMatch(userId, url);
  } catch (error) {
    console.error("Error in findForAutofill:", error);
    return [];
  }
};

// Create and export the model
const Password = mongoose.model('Password', PasswordSchema);
export default Password;
