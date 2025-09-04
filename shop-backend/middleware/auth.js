const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.isAuthenticated = async (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.fail('وارد شوید.', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.fail('توکن معتبر نیست.', 401);
  }
};

exports.isAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') return res.fail('دسترسی غیرمجاز.', 403);
  next();
};