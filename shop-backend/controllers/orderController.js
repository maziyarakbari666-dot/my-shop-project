const Order = require('../models/Order');

// افزودن سفارش جدید
exports.addOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// دریافت همه سفارش‌ها
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// دریافت جزئیات یک سفارش
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.product');
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// لغو سفارش (با دلیل)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'بدون دلیل';
    await order.save();
    res.json({ message: 'سفارش لغو شد', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};