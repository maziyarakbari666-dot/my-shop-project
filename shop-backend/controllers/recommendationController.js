const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getRecommendations = async (req, res, next) => {
  try {
    const { userId, productId, limit = 10 } = req.query;
    const max = Math.min(Number(limit) || 10, 50);
    // Item-based: related to a given productId
    if (productId && mongoose.Types.ObjectId.isValid(String(productId))) {
      const others = await Order.find({ 'products.product': productId }).lean();
      const scores = new Map();
      for (const o of others) {
        let contains = false;
        for (const line of o.products || []) if (String(line.product) === String(productId)) { contains = true; break; }
        if (!contains) continue;
        for (const line of o.products || []) {
          const pid = String(line.product);
          if (pid === String(productId)) continue;
          scores.set(pid, (scores.get(pid) || 0) + Number(line.quantity || 1));
        }
      }
      const sorted = Array.from(scores.entries()).sort((a,b)=>b[1]-a[1]).slice(0, max);
      const ids = sorted.map(([id]) => id);
      const prods = await Product.find({ _id: { $in: ids }, active: true }).lean();
      return res.success({ recommendations: prods });
    }
    // If user provided: collaborative filtering (very simple)
    if (userId) {
      const userOrders = await Order.find({ user: userId }).lean();
      const userProductIds = new Set();
      for (const o of userOrders) {
        for (const line of o.products || []) userProductIds.add(String(line.product));
      }
      // Find other orders containing any of these products
      const others = await Order.find({ 'products.product': { $in: Array.from(userProductIds) } }).lean();
      const scores = new Map();
      for (const o of others) {
        for (const line of o.products || []) {
          const pid = String(line.product);
          if (userProductIds.has(pid)) continue; // don't recommend already bought
          scores.set(pid, (scores.get(pid) || 0) + Number(line.quantity || 1));
        }
      }
      const sorted = Array.from(scores.entries()).sort((a,b)=>b[1]-a[1]).slice(0, max);
      const ids = sorted.map(([id]) => id);
      const prods = await Product.find({ _id: { $in: ids }, active: true }).lean();
      return res.success({ recommendations: prods });
    }
    // Fallback: trending by last 30 days
    const from = new Date(Date.now() - 30*24*60*60*1000);
    const orders = await Order.find({ createdAt: { $gte: from } }).lean();
    const counter = new Map();
    for (const o of orders) {
      for (const line of o.products || []) {
        const id = String(line.product);
        counter.set(id, (counter.get(id) || 0) + Number(line.quantity || 1));
      }
    }
    const arr = Array.from(counter.entries()).sort((a,b)=>b[1]-a[1]).slice(0, max);
    const ids = arr.map(([id]) => id);
    const prods = await Product.find({ _id: { $in: ids }, active: true }).lean();
    return res.success({ recommendations: prods });
  } catch (err) { next(err); }
};


