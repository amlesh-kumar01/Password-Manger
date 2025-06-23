import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to authenticate JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ error: 'No authentication token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      console.log('Authentication failed: Invalid token structure');
      return res.status(401).json({ error: 'Invalid token structure' });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('Authentication failed: User not found');
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    console.log('Authentication successful for user:', user._id);
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

export default auth;
