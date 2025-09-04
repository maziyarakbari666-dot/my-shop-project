const Order = require('../models/Order');

<<<<<<< HEAD
// افزودن سفارش جدید
exports.addOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
=======
exports.createOrder = async (req, res, next) => {
  try {
    const { products, address } = req.body;
    let totalPrice = 0;
    products.forEach(p => totalPrice += p.price * p.quantity);
    const order = await Order.create({
      user: req.user.id,
      products: products.map(p => ({ product: p.product, quantity: p.quantity })),
      totalPrice,
      address
    });
    res.success({ order });
>>>>>>> 52aec5e0824b0bbdf41a9c6b5055947101311081
  } catch (err) {
    next(err);
  }
};

<<<<<<< HEAD
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
=======
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('products.product');
    res.success({ orders });
  } catch (err) {
    next(err);
  }
};

exports.payOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.fail('سفارش پیدا نشد.', 404);
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
    res.success({ order });
  } catch (err) {
    next(err);
>>>>>>> 52aec5e0824b0bbdf41a9c6b5055947101311081
  }
};