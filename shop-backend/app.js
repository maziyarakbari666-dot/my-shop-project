require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const compression = require('compression');
const morgan = require('morgan');
const { sanitize } = require('express-mongo-sanitize');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { apiResponse } = require('./middleware/response');
const { errorHandler } = require('./middleware/error');
const { isAuthenticated, isAdmin } = require('./middleware/auth');
const { productCache, categoryCache, settingsCache } = require('./middleware/cache');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const couponRoutes = require('./routes/couponRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courierRoutes = require('./routes/courierRoutes');
const Settings = require('./models/Settings');
const paymentRoutes = require('./routes/paymentRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const categoryController = require('./controllers/categoryController');
const bnplRoutes = require('./routes/bnplRoutes');
const { startScheduler: startBnplReminderScheduler } = require('./services/bnplReminder');
const { scheduleDeletion } = require('./services/whatsapp');

const app = express();
const userController = require('./controllers/userController');

// Body parsing
app.use(express.json());
// Sanitize MongoDB operators from payloads
// Sanitize Mongo-like operators in request payloads without reassigning req.query
app.use((req, res, next) => {
  try {
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    if (req.headers) sanitize(req.headers);
    if (req.query) sanitize(req.query);
    next();
  } catch (e) {
    next(e);
  }
});
// Cookie parsing for httpOnly auth cookies
app.use(cookieParser());

// CORS (restrict origins via env; allow non-browser tools without Origin)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));

// Security
app.use(helmet());
// Content Security Policy (conservative; relaxed in dev for inline/eval)
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
// HTTP request logging (dev: concise, prod: combined)
app.use(morgan(isProd ? 'combined' : 'dev'));
// Trust proxy (for x-forwarded-* headers behind reverse proxies/load balancers)
app.set('trust proxy', 1);
// Enforce HTTPS in production (honors x-forwarded-proto thanks to trust proxy)
if (isProd && String(process.env.FORCE_HTTPS || 'true').toLowerCase() === 'true') {
  app.use((req, res, next) => {
    if (req.secure) return next();
    const host = req.headers.host;
    const url = req.originalUrl || req.url || '/';
    return res.redirect(301, `https://${host}${url}`);
  });
}
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'http://localhost'],
    connectSrc: ["'self'"].concat((process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)),
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
}));
// Global API rate limiting (scoped to /api, with standard headers and JSON handler)
// Exempt auth/me and auth/send-otp because they have dedicated limiters below
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    try {
      return req.path === '/auth/send-otp' || (req.method === 'GET' && req.path === '/auth/me');
    } catch (_) {
      return false;
    }
  },
  handler: (req, res/*, next*/) => {
    return res.fail('تعداد درخواست بیش از حد مجاز است.', 429);
  }
});
// Compression with optimized settings
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress files > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter for other responses
    return compression.filter(req, res);
  }
}));

// Response helpers
app.use(apiResponse);

// CSRF protection (scoped): issue token via endpoint; enforce on cart mutations
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: isProd ? 'strict' : 'lax', secure: isProd } });
app.get('/api/csrf', csrfProtection, (req, res) => {
  try { return res.success({ csrfToken: req.csrfToken() }); } catch (e) { return res.fail('CSRF error', 500); }
});

// DB (with in-memory fallback)
async function initDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shop';
  try {
    await mongoose.connect(mongoUri);
    if (!isTest) console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      try {
        const mem = await MongoMemoryServer.create();
        const memUri = mem.getUri();
        await mongoose.connect(memUri);
        if (!isTest) console.log('Connected to in-memory MongoDB (dev/test)');
      } catch (e) {
        console.error('Failed to start in-memory MongoDB:', e.message);
      }
    } else {
      console.error('FATAL: Database connection failed in production. Exiting.');
      process.exit(1);
    }
  }
}
initDatabase();

// Routes
// Dedicated rate limit for auth endpoints (return JSON via apiResponse)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res/*, next*/) => {
    return res.fail('درخواست بیش از حد برای احراز هویت. لطفا بعدا تلاش کنید.', 429);
  }
});
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isProd ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res/*, next*/) => {
    return res.fail('ارسال بیش از حد کد. لطفا بعدا تلاش کنید.', 429);
  }
});
// Apply global API limiter (skips /auth/me and /auth/send-otp per config above)
app.use('/api', globalApiLimiter);
// Exempt GET /api/auth/me and POST /api/auth/send-otp from the general authLimiter
app.get('/api/auth/me', isAuthenticated, userController.me);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/send-otp' || (req.method === 'GET' && req.path === '/me')) return next();
  return authLimiter(req, res, next);
}, userRoutes);
app.use('/api/products', productCache, productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/couriers', courierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bnpl', bnplRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', csrfProtection, cartRoutes);

// simple scheduler (every 10 minutes) to delete expired WhatsApp messages
if (!isTest) {
  try {
    setInterval(() => {
      try { scheduleDeletion(); } catch(_){ }
    }, 10 * 60 * 1000);
  } catch (_) {}
}
app.use('/api/addresses', addressRoutes);

// Public settings
app.get('/api/settings', async (req, res) => {
  try {
    const s = await Settings.findOne().sort({ createdAt: -1 });
    if (!s) return res.success({ settings: {} });
    // expose only public subset
    const pub = {
      deliveryZones: s.deliveryZones,
      dailyHours: s.dailyHours,
      payments: s.payments,
      hero: s.hero,
      about: s.about,
      contact: s.contact,
      footer: s.footer
    };
    res.success({ settings: pub });
  } catch (e) { res.fail('خطا در تنظیمات', 500); }
});

// Category minimal endpoints
app.post('/api/categories', isAuthenticated, isAdmin, categoryController.addCategory);
app.get('/api/categories', categoryController.getCategories);

// Static
app.use('/uploads', express.static('uploads', { maxAge: '7d', etag: true }));

// Health
app.get('/', (req, res) => { res.send('Shop Backend is running'); });

// Error handler
app.use(errorHandler);

// Background jobs (BNPL reminders)
try {
  const enableJobsDefault = isTest ? 'false' : 'true';
  if (String(process.env.ENABLE_JOBS || enableJobsDefault).toLowerCase() === 'true') {
    startBnplReminderScheduler();
  }
} catch (e) {
  console.error('[BNPL][REMINDER] Failed to start scheduler:', e.message);
}
module.exports = app;