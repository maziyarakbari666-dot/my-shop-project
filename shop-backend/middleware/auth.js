const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader) {
    token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }
  if (!token) return res.fail('وارد شوید.', 401);
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (e) {
    res.fail('توکن معتبر نیست.', 401);
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.fail('دسترسی غیرمجاز.', 403);
    next();
  } catch (e) {
    next(e);
  }
};