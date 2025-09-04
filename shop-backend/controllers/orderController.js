const Order = require('../models/Order');

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
  } catch (err) {
    next(err);
  }
};

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
  }
};