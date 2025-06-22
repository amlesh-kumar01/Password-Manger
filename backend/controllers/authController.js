import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
export async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Login user
export async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    if (!user.password) {
      return res.status(400).json({ error: 'This account uses Google Sign-in' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Google Sign-in
export async function googleSignIn(req, res) {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, name, email, picture } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        picture
      });
      
      await user.save();
    } else {
      // Update Google ID and picture if needed
      user.googleId = googleId;
      user.picture = picture;
      await user.save();
    }
    
    // Generate token
    const jwtToken = generateToken(user._id);
    
    res.json({
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Google Sign-in error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Get user data
export async function getUser(req, res) {
  try {
    // User data from auth middleware
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Validate token
export async function validateToken(req, res) {
  try {
    // User data from auth middleware
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ valid: false });
    }
    
    res.json({ 
      valid: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (err) {
    console.error('Validate token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Logout (just for server-side invalidation if needed)
export function logout(req, res) {
  // In a more complex implementation, we might add the token to a blacklist
  res.json({ message: 'Logged out successfully' });
}
