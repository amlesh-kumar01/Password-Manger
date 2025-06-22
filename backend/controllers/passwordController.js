import Password from '../models/Password.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// Get all passwords for a user
export const getPasswords = async (req, res) => {
  try {
    const passwords = await Password.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(passwords);
  } catch (err) {
    console.error('Get passwords error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single password
export const getPassword = async (req, res) => {
  try {
    const password = await Password.findOne({
      _id: req.params.id,      userId: req.userId
    });
    
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }
    
    res.json(password);
  } catch (err) {
    console.error('Get password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get passwords for a specific website
export const getPasswordsByWebsite = async (req, res) => {
  try {
    const domain = req.params.domain;
    
    // Find passwords that match domain or URL contains domain
    const passwords = await Password.find({
      userId: req.userId,
      $or: [
        { website: { $regex: domain, $options: 'i' } },
        { url: { $regex: domain, $options: 'i' } }
      ]
    }).sort({ updatedAt: -1 });
    
    res.json(passwords);
  } catch (err) {
    console.error('Get passwords by website error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new password
export const createPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { website, url, username, password, notes, category, deviceId } = req.body;
    
    const newPassword = new Password({
      userId: req.userId,
      website,
      url,
      username,
      password,
      notes,
      category: category || 'personal',
      deviceIds: deviceId ? [deviceId] : []
    });
    
    await newPassword.save();
    
    res.status(201).json(newPassword);
  } catch (err) {
    console.error('Create password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update a password
export const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { website, url, username, password, notes, category, deviceId } = req.body;
    
    // Find and update password
    let updatedPassword = await Password.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!updatedPassword) {
      return res.status(404).json({ error: 'Password not found' });
    }
    
    // Update fields
    updatedPassword.website = website;
    updatedPassword.url = url;
    updatedPassword.username = username;
    updatedPassword.password = password;
    updatedPassword.notes = notes;
    
    // Update category if provided
    if (category) {
      updatedPassword.category = category;
    }
    
    // Add device ID if not already in the list
    if (deviceId && !updatedPassword.deviceIds.includes(deviceId)) {
      updatedPassword.deviceIds.push(deviceId);
    }
    
    await updatedPassword.save();
    
    res.json(updatedPassword);
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a password
export const deletePassword = async (req, res) => {
  try {
    const password = await Password.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }
    
    await Password.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Password removed' });
  } catch (err) {
    console.error('Delete password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get password strength
export const getPasswordStrength = async (req, res) => {
  try {
    const password = await Password.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }
    
    res.json({ 
      passwordStrength: password.passwordStrength,
      suggestions: getPasswordStrengthSuggestions(password.password, password.passwordStrength) 
    });
  } catch (err) {
    console.error('Get password strength error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to generate password strength suggestions
function getPasswordStrengthSuggestions(password, strength) {
  const suggestions = [];
  
  if (strength < 50) {
    if (password.length < 12) {
      suggestions.push('Make your password longer (at least 12 characters)');
    }
    if (!/[A-Z]/.test(password)) {
      suggestions.push('Add uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
      suggestions.push('Add numbers');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      suggestions.push('Add special characters');
    }
    if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
      suggestions.push('Avoid using only letters or only numbers');
    }
  }
  
  return suggestions;
}

// Export passwords
export const exportPasswords = async (req, res) => {
  try {
    const { format } = req.query;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Unsupported format. Use json or csv' });
    }
    
    // Get all passwords for user
    const passwords = await Password.find({ userId: req.userId });
    
    if (passwords.length === 0) {
      return res.status(404).json({ error: 'No passwords found' });
    }
    
    let exportData;
    
    if (format === 'json') {
      exportData = JSON.stringify(passwords.map(pwd => pwd.prepareForExport('json')));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=passwords.json');
    } else if (format === 'csv') {
      // Create CSV header
      let csv = 'website,url,username,password,notes,category,exportedAt\n';
      
      // Add each password as a row
      passwords.forEach(pwd => {
        const pwdData = pwd.prepareForExport('csv');
        csv += pwdData.split('\n')[1] + '\n';
      });
      
      exportData = csv;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=passwords.csv');
    }
    
    // Update export history for each password
    await Promise.all(passwords.map(async (pwd) => {
      pwd.exportHistory.push({
        exportedAt: new Date(),
        exportFormat: format
      });
      await pwd.save();
    }));
    
    res.send(exportData);
  } catch (err) {
    console.error('Export passwords error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Import passwords
export const importPasswords = async (req, res) => {
  try {
    const { format } = req.query;
    const { data } = req.body;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Unsupported format. Use json or csv' });
    }
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    const importedPasswords = await Password.importFromFile(req.userId, data, format);
    
    res.status(201).json({ 
      message: `Successfully imported ${importedPasswords.length} passwords`,
      passwords: importedPasswords
    });
  } catch (err) {
    console.error('Import passwords error:', err);
    res.status(500).json({ error: 'Import failed. Please check your data format.' });
  }
};

// Sync passwords across devices
export const syncPasswords = async (req, res) => {
  try {
    const { deviceId, passwords } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    if (!passwords || !Array.isArray(passwords)) {
      return res.status(400).json({ error: 'Passwords array is required' });
    }
    
    const syncResults = {
      updated: [],
      created: [],
      unchanged: [],
      conflicts: []
    };
    
    // Process each password in the sync request
    for (const incomingPassword of passwords) {
      // Check if password exists by ID
      if (incomingPassword._id) {
        const existingPassword = await Password.findOne({ 
          _id: incomingPassword._id,
          userId: req.userId
        });
        
        if (existingPassword) {
          // Check version and update if incoming is newer
          if (existingPassword.resolveConflict(incomingPassword)) {
            // Add device ID if not already tracked
            if (!existingPassword.deviceIds.includes(deviceId)) {
              existingPassword.deviceIds.push(deviceId);
            }
            
            existingPassword.lastSynced = Date.now();
            await existingPassword.save();
            syncResults.updated.push(existingPassword._id);
          } else {
            syncResults.unchanged.push(existingPassword._id);
          }
          continue;
        }
      }
      
      // Check if a similar password exists (same website and username)
      const similarPassword = await Password.findOne({
        userId: req.userId,
        website: incomingPassword.website,
        username: incomingPassword.username
      });
      
      if (similarPassword) {
        // Potential conflict - add to conflicts list
        syncResults.conflicts.push({
          local: {
            _id: similarPassword._id,
            version: similarPassword.version,
            updatedAt: similarPassword.updatedAt
          },
          remote: {
            version: incomingPassword.version,
            updatedAt: incomingPassword.updatedAt
          }
        });
        continue;
      }
      
      // Create new password
      const newPassword = new Password({
        ...incomingPassword,
        userId: req.userId,
        deviceIds: [deviceId],
        lastSynced: Date.now()
      });
      
      await newPassword.save();
      syncResults.created.push(newPassword._id);
    }
    
    // Get all user passwords updated since last sync for this device
    const lastSyncTimestamp = req.query.lastSync ? new Date(req.query.lastSync) : new Date(0);
    
    const updatedPasswordsForDevice = await Password.find({
      userId: req.userId,
      updatedAt: { $gt: lastSyncTimestamp },
      deviceIds: { $ne: deviceId }
    });
    
    res.json({
      syncResults,
      updatedPasswords: updatedPasswordsForDevice,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Sync passwords error:', err);
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
};

// Share a password with another user
export const sharePassword = async (req, res) => {
  try {
    const { targetUserEmail, accessLevel } = req.body;
    
    if (!targetUserEmail) {
      return res.status(400).json({ error: 'Target user email is required' });
    }
    
    if (!['read', 'write'].includes(accessLevel)) {
      return res.status(400).json({ error: 'Access level must be read or write' });
    }
    
    // Get password to share
    const password = await Password.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });    }
    
    // Find target user by email
    const targetUser = await User.findOne({ email: targetUserEmail });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    // Check if already shared with this user
    const alreadyShared = password.sharedWith.find(
      share => share.userId.toString() === targetUser._id.toString()
    );
    
    if (alreadyShared) {
      // Update access level if different
      if (alreadyShared.accessLevel !== accessLevel) {
        alreadyShared.accessLevel = accessLevel;
        await password.save();
      }
      return res.json({ message: 'Access level updated', password });
    }
    
    // Add to shared users
    password.sharedWith.push({
      userId: targetUser._id,
      accessLevel,
      sharedAt: Date.now()
    });
    
    password.isShared = true;
    await password.save();
    
    res.json({ message: 'Password shared successfully', password });
  } catch (err) {
    console.error('Share password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get shared passwords
export const getSharedPasswords = async (req, res) => {
  try {
    // Find passwords shared with current user
    const sharedPasswords = await Password.find({
      'sharedWith.userId': req.userId
    }).populate('userId', 'name email');
    
    res.json(sharedPasswords);
  } catch (err) {
    console.error('Get shared passwords error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
