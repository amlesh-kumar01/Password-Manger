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
  },
  url: {
    type: String
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
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
      this.isModified('website') || this.isModified('url')) {
    this.version += 1;
  }
  
  // Calculate password strength if password is modified
  if (this.isModified('password')) {
    this.passwordStrength = calculatePasswordStrength(this.password);
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

// Create and export the model
const Password = mongoose.model('Password', PasswordSchema);
export default Password;
