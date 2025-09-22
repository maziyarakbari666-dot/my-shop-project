const Product = require('../models/Product');
const { invalidateProductCache } = require('../middleware/cache');

// افزودن محصول جدید
exports.addProduct = async (req, res, next) => {
  try {
    const { name, price, category, description, stock, discountPercent } = req.body;
    const image = req.file ? req.file.path : undefined;
    const product = await Product.create({ name, price, category, description, stock, discountPercent: Number(discountPercent) || 0, image });
    
    // Invalidate product cache
    invalidateProductCache();
    
    res.success({ product });
  } catch (err) {
    next(err);
  }
};

// گرفتن لیست همه محصولات
exports.getAllProducts = async (req, res, next) => {
  try {
    const { q, category, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (q) filter.name = new RegExp(String(q), 'i');
    if (category) filter.category = category;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    // Fetch with pagination; rely on existing indexes without forced hints
    const [items, total] = await Promise.all([
      Product.find(filter)
        .select('name price image stock category description discountPercent')
        .populate('category', 'name')
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Product.countDocuments(filter)
    ]);
    
    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min client, 10 min CDN
      'ETag': `"products-${page}-${pageSize}-${q || ''}-${category || ''}"`,
      'Last-Modified': new Date().toUTCString()
    });
    
    res.success({ products: items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
};

// گرفتن یک محصول خاص با آیدی
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('+reviews').populate('category', 'name').lean();
    if (!product) {
      return res.status(404).json({ error: 'محصول یافت نشد!' });
    }
    res.success({ product });
  } catch (err) {
    next(err);
  }
};

// آپدیت محصول
exports.updateProduct = async (req, res, next) => {
  try {
    const updates = req.body;
    if (typeof updates.discountPercent !== 'undefined') {
      updates.discountPercent = Number(updates.discountPercent) || 0;
    }
    if (req.file) {
      updates.image = req.file.path;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'محصول یافت نشد!' });
    }
    res.success({ product });
  } catch (err) {
    next(err);
  }
};

// حذف محصول
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'محصول یافت نشد!' });
    }
    res.success({ message: 'محصول حذف شد.' });
  } catch (err) {
    next(err);
  }
};

// جستجوی محصولات با کوئری (search)
exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q ? { name: new RegExp(q, 'i') } : {};
    const products = await Product.find(filter).select('name price image stock category').populate('category', 'name').lean();
    res.success({ products });
  } catch (err) {
    next(err);
  }
};

// Comments endpoints
exports.addComment = async (req, res, next) => {
  try {
    const { productId, user, text } = req.body;
    const prod = await Product.findById(productId).lean();
    if (!prod) return res.fail('محصول یافت نشد.', 404);
    prod.reviews.push({ user, text, status: 'pending' });
    await prod.save();
    res.success({ product: prod });
  } catch (err) { next(err); }
};

exports.listComments = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const prod = await Product.findById(productId);
    if (!prod) return res.fail('محصول یافت نشد.', 404);
    const reviews = prod.reviews.filter(r => r.status === 'approved');
    res.success({ reviews });
  } catch (err) { next(err); }
};

exports.moderateComment = async (req, res, next) => {
  try {
    const { productId, index, action } = req.body; // action: 'approve'|'reject'
    const prod = await Product.findById(productId);
    if (!prod) return res.fail('محصول یافت نشد.', 404);
    if (prod.reviews[index]) {
      prod.reviews[index].status = action === 'approve' ? 'approved' : 'rejected';
      await prod.save();
    }
    res.success({ product: prod });
  } catch (err) { next(err); }
};

// Admin: list all reviews across products
exports.adminListAllReviews = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(200, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const match = {};
    if (q) {
      const regex = new RegExp(String(q), 'i');
      match.$or = [
        { 'reviews.user': regex },
        { name: regex },
        { 'reviews.text': regex },
      ];
    }

    // Flatten reviews with aggregation for efficient pagination
    const pipeline = [
      { $match: {} },
      { $project: { name: 1, reviews: 1 } },
      { $unwind: '$reviews' },
      ...(q ? [{ $match: { $or: [ { 'reviews.user': { $regex: new RegExp(String(q), 'i') } }, { name: { $regex: new RegExp(String(q), 'i') } }, { 'reviews.text': { $regex: new RegExp(String(q), 'i') } } ] } }] : []),
      { $sort: { 'reviews.createdAt': -1 } },
      { $facet: {
        data: [ { $skip: skip }, { $limit: pageSize } ],
        meta: [ { $count: 'total' } ]
      }},
    ];
    const agg = await Product.aggregate(pipeline);
    const data = (agg[0]?.data || []).map((doc, idx) => ({
      productId: doc._id,
      productName: doc.name,
      index: 0, // index in original reviews not needed for moderation by position; handled by separate endpoint
      user: doc.reviews.user,
      text: doc.reviews.text,
      status: doc.reviews.status,
      createdAt: doc.reviews.createdAt
    }));
    const total = agg[0]?.meta?.[0]?.total || 0;
    res.success({ reviews: data, total, page, pageSize });
  } catch (err) { next(err); }
};

// Validate items for checkout
exports.validateCart = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ product, quantity }]
    const results = [];
    for (const it of (items || [])) {
      const prod = await Product.findById(it.product).select('price stock').lean();
      if (!prod) {
        results.push({ id: it.product, ok: false, reason: 'not_found' });
        continue;
      }
      const priceOk = Number(it.price) === Number(prod.price);
      const stockOk = Number(it.quantity) <= Number(prod.stock);
      // downtime windows check (pauseTimes: [{from:'HH:MM', to:'HH:MM'}])
      let availableNow = true;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const cur = `${hh}:${mm}`;
      const pauses = Array.isArray(prod.pauseTimes) ? prod.pauseTimes : [];
      for (const pt of pauses) {
        if (pt && pt.from && pt.to && cur >= pt.from && cur <= pt.to) { availableNow = false; break; }
      }
      results.push({ id: String(prod._id), ok: priceOk && stockOk && availableNow, priceOk, stockOk, availableNow, currentPrice: prod.price, currentStock: prod.stock });
    }
    res.success({ results });
  } catch (err) { next(err); }
};