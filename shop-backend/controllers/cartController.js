const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreate(userId) {
  let c = await Cart.findOne({ user: userId });
  if (!c) c = await Cart.create({ user: userId, items: [] });
  return c;
}

exports.getCart = async (req, res, next) => {
  try {
    const c = await getOrCreate(req.user.id);
    res.success({ cart: c });
  } catch (e) { next(e); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const p = await Product.findById(productId);
    if (!p) return res.fail('محصول یافت نشد.', 404);
    const c = await getOrCreate(req.user.id);
    const q = Math.max(1, Number(quantity)||1);
    const idx = c.items.findIndex(i => String(i.product) === String(productId));
    if (idx >= 0) {
      c.items[idx].quantity += q;
      c.items[idx].price = p.price;
    } else {
      c.items.push({ product: p._id, quantity: q, price: p.price });
    }
    await c.save();
    res.success({ cart: c });
  } catch (e) { next(e); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const c = await getOrCreate(req.user.id);
    const q = Math.max(1, Number(quantity)||1);
    const idx = c.items.findIndex(i => String(i.product) === String(productId));
    if (idx < 0) return res.fail('آیتم یافت نشد.', 404);
    c.items[idx].quantity = q;
    await c.save();
    res.success({ cart: c });
  } catch (e) { next(e); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const c = await getOrCreate(req.user.id);
    c.items = c.items.filter(i => String(i.product) !== String(productId));
    await c.save();
    res.success({ cart: c });
  } catch (e) { next(e); }
};

exports.clear = async (req, res, next) => {
  try {
    const c = await getOrCreate(req.user.id);
    c.items = [];
    await c.save();
    res.success({ cart: c });
  } catch (e) { next(e); }
};



