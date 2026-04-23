const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Auth middleware - authHeader:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware - No valid Bearer token');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Auth middleware - Token length:', token.length);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware - Token decoded, userId:', decoded.userId);
      
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('Auth middleware - User not found');
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      req.user = user;
      console.log('Auth middleware - Authentication successful');
      next();
    } catch (jwtError) {
      console.log('Auth middleware - JWT Error:', jwtError.name, jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired' 
        });
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

module.exports = authMiddleware;
