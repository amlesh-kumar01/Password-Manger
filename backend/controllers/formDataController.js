import FormData from '../models/FormData.js';
import { validationResult } from 'express-validator';

// Get all form data for a user
export async function getFormData(req, res) {
  try {
    const formData = await FormData.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(formData);
  } catch (err) {
    console.error('Get form data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Get a single form data
export async function getFormDataById(req, res) {
  try {
    const formData = await FormData.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!formData) {
      return res.status(404).json({ error: 'Form data not found' });
    }
    
    res.json(formData);
  } catch (err) {
    console.error('Get form data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Get form data for a specific website
export async function getFormDataByWebsite(req, res) {
  try {
    const domain = req.params.domain;
    
    // Find form data that match domain or URL contains domain
    const formData = await FormData.find({
      userId: req.userId,
      $or: [
        { website: { $regex: domain, $options: 'i' } },
        { url: { $regex: domain, $options: 'i' } }
      ]
    }).sort({ updatedAt: -1 });
    
    res.json(formData);
  } catch (err) {
    console.error('Get form data by website error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Create a new form data
export async function createFormData(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, website, url, fields } = req.body;
    
    const newFormData = new FormData({
      userId: req.userId,
      name,
      website,
      url,
      fields
    });
    
    await newFormData.save();
    
    res.status(201).json(newFormData);
  } catch (err) {
    console.error('Create form data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Update a form data
export async function updateFormData(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, website, url, fields } = req.body;
    
    // Find and update form data
    let updatedFormData = await FormData.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!updatedFormData) {
      return res.status(404).json({ error: 'Form data not found' });
    }
    
    // Update fields
    updatedFormData.name = name;
    updatedFormData.website = website;
    updatedFormData.url = url;
    updatedFormData.fields = fields;
    updatedFormData.updatedAt = Date.now();
    
    await updatedFormData.save();
    
    res.json(updatedFormData);
  } catch (err) {
    console.error('Update form data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Delete a form data
export async function deleteFormData(req, res) {
  try {
    const formData = await FormData.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!formData) {
      return res.status(404).json({ error: 'Form data not found' });
    }
    
    await FormData.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Form data removed' });
  } catch (err) {
    console.error('Delete form data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
