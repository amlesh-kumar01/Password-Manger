import express from 'express';
import { body } from 'express-validator';
import * as passwordController from '../controllers/passwordController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/passwords
// @desc    Get all passwords for a user
// @access  Private
router.get('/', passwordController.getPasswords);

// @route   GET /api/passwords/:id
// @desc    Get a single password
// @access  Private
router.get('/:id', passwordController.getPassword);

// @route   GET /api/passwords/site/:domain
// @desc    Get passwords for a specific website
// @access  Private
router.get('/site/:domain', passwordController.getPasswordsByWebsite);

// @route   POST /api/passwords
// @desc    Create a new password
// @access  Private
router.post(
  '/',
  [
    body('website', 'Website is required').not().isEmpty(),
    body('username', 'Username is required').not().isEmpty(),
    body('password', 'Password is required').not().isEmpty()
  ],
  passwordController.createPassword
);

// @route   PUT /api/passwords/:id
// @desc    Update a password
// @access  Private
router.put(
  '/:id',
  [
    body('website', 'Website is required').not().isEmpty(),
    body('username', 'Username is required').not().isEmpty(),
    body('password', 'Password is required').not().isEmpty()
  ],
  passwordController.updatePassword
);

// @route   DELETE /api/passwords/:id
// @desc    Delete a password
// @access  Private
router.delete('/:id', passwordController.deletePassword);

// @route   GET /api/passwords/:id/strength
// @desc    Get password strength and suggestions
// @access  Private
router.get('/:id/strength', passwordController.getPasswordStrength);

// @route   GET /api/passwords/export
// @desc    Export passwords in specified format
// @access  Private
router.get('/export', passwordController.exportPasswords);

// @route   POST /api/passwords/import
// @desc    Import passwords from data
// @access  Private
router.post('/import', passwordController.importPasswords);

// @route   POST /api/passwords/sync
// @desc    Sync passwords across devices
// @access  Private
router.post('/sync', passwordController.syncPasswords);

// @route   POST /api/passwords/:id/share
// @desc    Share password with another user
// @access  Private
router.post('/:id/share', passwordController.sharePassword);

// @route   GET /api/passwords/shared
// @desc    Get passwords shared with user
// @access  Private
router.get('/shared', passwordController.getSharedPasswords);

export default router;
