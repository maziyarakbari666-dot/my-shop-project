const Order = require('../order');

// ثبت سفارش جدید
exports.createOrder = async (req, res) => {
  try {
    const { user, products, totalPrice } = req.body;
    const order = new Order({ user, products, totalPrice });
    await order.save();
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// دریافت لیست سفارش‌ها
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};