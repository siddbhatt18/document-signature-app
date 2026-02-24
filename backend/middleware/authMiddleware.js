const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    // Check if token format is "Bearer <token>"
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified; // Add the user id to the request
    next(); // Move to the next function
  } catch (error) {
    // FIX: Must be 401 so the frontend Axios Interceptor catches it and logs the user out
    res.status(401).json({ message: 'Invalid or Expired Token' });
  }
};

module.exports = verifyToken;