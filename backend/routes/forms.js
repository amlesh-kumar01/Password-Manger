import express from 'express';
import { body } from 'express-validator';
import * as formDataController from '../controllers/formDataController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/forms
// @desc    Get all form data for a user
// @access  Private
router.get('/', formDataController.getFormData);

// @route   GET /api/forms/:id
// @desc    Get a single form data
// @access  Private
router.get('/:id', formDataController.getFormDataById);

// @route   GET /api/forms/site/:domain
// @desc    Get form data for a specific website
// @access  Private
router.get('/site/:domain', formDataController.getFormDataByWebsite);

// @route   POST /api/forms
// @desc    Create a new form data
// @access  Private
router.post(
  '/',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('website', 'Website is required').not().isEmpty(),
    body('fields', 'Fields are required').isArray({ min: 1 })
  ],
  formDataController.createFormData
);

// @route   PUT /api/forms/:id
// @desc    Update a form data
// @access  Private
router.put(
  '/:id',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('website', 'Website is required').not().isEmpty(),
    body('fields', 'Fields are required').isArray({ min: 1 })
  ],
  formDataController.updateFormData
);

// @route   DELETE /api/forms/:id
// @desc    Delete a form data
// @access  Private
router.delete('/:id', formDataController.deleteFormData);

export default router;
