import express from 'express';
import { auth } from '../middleware/auth.js';
import Password from '../models/Password.js';

const router = express.Router();

/**
 * @route   GET /api/passwords/autofill
 * @desc    Get passwords for autofill based on URL and form data
 * @access  Private
 */
router.get('/autofill', auth, async (req, res) => {
  try {
    const { url, formId, formAction, inputFields } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        message: 'URL is required for autofill' 
      });
    }
    
    // Find matching passwords
    const matches = await Password.findForAutofill(
      req.user.id, 
      { 
        url, 
        formId: formId || null, 
        formAction: formAction || null,
        inputFields: inputFields ? JSON.parse(inputFields) : []
      }
    );
    
    return res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error in autofill:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/passwords/record-usage/:id
 * @desc    Record that a password was used for autofill
 * @access  Private
 */
router.post('/record-usage/:id', auth, async (req, res) => {
  try {
    const password = await Password.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!password) {
      return res.status(404).json({ 
        success: false, 
        message: 'Password not found' 
      });
    }
    
    // Record the usage and update form data if provided
    await password.recordUsage();
    
    if (req.body.formData) {
      await password.updateFormData(req.body.formData);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Usage recorded' 
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
