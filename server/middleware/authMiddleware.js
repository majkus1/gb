const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Unauthorized');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
      userId: decoded.userId, 
      roles: decoded.roles,
      username: decoded.username
    };
    console.log("Authenticated user:", req.user);
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(401).send('Unauthorized');
  }
};
