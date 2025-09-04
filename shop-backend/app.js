const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes'); // ← مرحله ۴ اینجاست!

const app = express();
app.use(express.json());

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