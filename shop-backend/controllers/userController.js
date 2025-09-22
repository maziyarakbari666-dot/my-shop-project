const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');

// Simple OTP generation
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// JWT helper
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '30d' }
  );
}

// Auth endpoints
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.fail('نام، ایمیل و رمز عبور الزامی است', 400);
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.fail('کاربری با این ایمیل از قبل وجود دارد', 400);
    }
    
    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user);
    
    res.success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.fail('ایمیل و رمز عبور الزامی است', 400);
    }
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.fail('ایمیل یا رمز عبور نادرست است', 401);
    }
    
    if (user.status === 'inactive') {
      return res.fail('حساب کاربری شما غیرفعال است', 403);
    }
    
    const token = generateToken(user);
    
    res.success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return res.fail('شماره موبایل معتبر وارد کنید', 400);
    }
    
    // Remove existing OTPs for this phone
    await Otp.deleteMany({ phone });
    
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await Otp.create({
      phone,
      code: otpCode,
      expiresAt
    });
    
    // In development, return the OTP code and log it to console
    const response = { message: 'کد یکبار مصرف ارسال شد' };
    if (process.env.NODE_ENV !== 'production') {
      response.debugCode = otpCode;
      console.log(`🔑 OTP Code for ${phone}: ${otpCode}`);
    } else {
      // Also log for development even if NODE_ENV is not set
      console.log(`🔑 OTP Code for ${phone}: ${otpCode}`);
      response.debugCode = otpCode;
    }
    
    res.success(response);
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, code, name } = req.body;
    
    if (!phone || !code) {
      return res.fail('شماره موبایل و کد الزامی است', 400);
    }
    
    const otp = await Otp.findOne({ 
      phone, 
      code,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otp) {
      return res.fail('کد نامعتبر یا منقضی شده است', 400);
    }
    
    // Remove the used OTP
    await Otp.deleteOne({ _id: otp._id });
    
    // Find or create user
    const email = `${phone}@otp.local`;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        name: name || phone,
        email,
        password: 'otp-user', // placeholder password
        phone
      });
    } else {
      // Update phone if not set
      if (!user.phone) {
        user.phone = phone;
        await user.save();
      }
    }
    
    if (user.status === 'inactive') {
      return res.fail('حساب کاربری شما غیرفعال است', 403);
    }
    
    const token = generateToken(user);
    
    res.success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.fail('احراز هویت نشده', 401);
    }
    
    const user = await User.findById(req.user.id).select('-password').populate('favorites', 'name price image');
    if (!user) {
      return res.fail('کاربر یافت نشد', 404);
    }
    
    if (user.status === 'inactive') {
      return res.fail('حساب کاربری شما غیرفعال است', 403);
    }
    
    res.success({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.fail('احراز هویت نشده', 401);
    }
    
    const { name, phone } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.fail('کاربر یافت نشد', 404);
    }
    
    res.success({ user });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // For stateless JWT, logout is handled client-side by removing the token
    // This endpoint exists for consistency with the frontend expectations
    res.success({ message: 'با موفقیت خارج شدید' });
  } catch (err) {
    next(err);
  }
};

// Favorites endpoints
exports.getFavorites = async (req, res, next) => {
  try {
    if (!req.user) return res.fail('احراز هویت نشده', 401);
    const user = await User.findById(req.user.id).populate('favorites', 'name price image');
    if (!user) return res.fail('کاربر یافت نشد', 404);
    res.success({ favorites: user.favorites || [] });
  } catch (err) { next(err); }
};

exports.addFavorite = async (req, res, next) => {
  try {
    if (!req.user) return res.fail('احراز هویت نشده', 401);
    const { productId } = req.body;
    if (!productId) return res.fail('شناسه محصول لازم است', 400);
    const prod = await Product.findById(productId).select('_id');
    if (!prod) return res.fail('محصول یافت نشد', 404);
    const user = await User.findByIdAndUpdate(req.user.id, { $addToSet: { favorites: prod._id } }, { new: true }).populate('favorites', 'name price image');
    res.success({ favorites: user.favorites });
  } catch (err) { next(err); }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    if (!req.user) return res.fail('احراز هویت نشده', 401);
    const { productId } = req.body;
    if (!productId) return res.fail('شناسه محصول لازم است', 400);
    const user = await User.findByIdAndUpdate(req.user.id, { $pull: { favorites: productId } }, { new: true }).populate('favorites', 'name price image');
    res.success({ favorites: user.favorites });
  } catch (err) { next(err); }
};