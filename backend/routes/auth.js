import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   POST /api/auth/google
// @desc    Google Sign-in
// @access  Public
router.post('/google', authController.googleSignIn);

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, authController.getUser);

// @route   GET /api/auth/validate
// @desc    Validate token
// @access  Private
router.get('/validate', auth, authController.validateToken);

// @route   POST /api/auth/logout
// @desc    Logout user (just for server-side invalidation if needed)
// @access  Private
router.post('/logout', auth, authController.logout);

export default router;
