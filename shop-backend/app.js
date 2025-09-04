const express = require('express');
const mongoose = require('mongoose');
const userController = require('./controllers/userController');
const orderController = require('./controllers/orderController');

const app = express();
app.use(express.json());

// اتصال به دیتابیس
mongoose.connect('mongodb://localhost:27017/myshop', { useNewUrlParser: true, useUnifiedTopology: true });

// روت‌های کاربر
app.post('/api/signup', userController.signup);
app.get('/api/users', userController.getUsers);

// روت‌های سفارش
app.post('/api/orders', orderController.createOrder);
app.get('/api/orders', orderController.getOrders);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
