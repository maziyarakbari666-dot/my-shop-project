require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
<<<<<<< HEAD
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes'); // ← مرحله ۴ اینجاست!
=======
const { apiResponse, errorHandler } = require('./middleware/response');
const logger = require('./utils/logger');
const userController = require('./controllers/userController');
const productController = require('./controllers/productController');
const categoryController = require('./controllers/categoryController');
const orderController = require('./controllers/orderController');
const { isAuthenticated, isAdmin } = require('./middleware/auth');
const upload = require('./middleware/upload');
>>>>>>> 52aec5e0824b0bbdf41a9c6b5055947101311081

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));
app.use(helmet());
app.use(mongoSanitize());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'تعداد درخواست بیش از حد مجاز است.'
}));
app.use(apiResponse);

<<<<<<< HEAD
mongoose.connect('mongodb://localhost:27017/shop-db')
  .then(() => console.log('Connected to MongoDB'));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // ← مرحله ۴ اینجاست!

app.get('/', (req, res) => {
  res.send('Shop Backend is running');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
=======
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/api/auth/signup', userController.signup);
app.post('/api/auth/login', userController.login);

app.post('/api/products', isAuthenticated, isAdmin, upload.single('image'), productController.addProduct);
app.get('/api/products', productController.searchProducts);

app.post('/api/categories', isAuthenticated, isAdmin, categoryController.addCategory);
app.get('/api/categories', categoryController.getCategories);

app.post('/api/orders', isAuthenticated, orderController.createOrder);
app.get('/api/orders', isAuthenticated, orderController.getUserOrders);
app.post('/api/orders/pay', isAuthenticated, orderController.payOrder);

app.use('/uploads', express.static('uploads'));

app.use(errorHandler);

app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`, { stack: err.stack });
  res.status(500).json({ status: 'error', error: 'خطای سرور!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
>>>>>>> 52aec5e0824b0bbdf41a9c6b5055947101311081
