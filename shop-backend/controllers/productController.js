const Product = require('../models/Product');
const { invalidateProductCache } = require('../middleware/cache');
const ProductWatch = require('../models/ProductWatch');

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
    // notify watchers: restock or discount
    try {
      const watchers = [];
      if (typeof updates.stock !== 'undefined' && Number(updates.stock) > 0) {
        const w = await ProductWatch.find({ product: product._id, type: 'restock', fulfilled: false }).populate('user','phone phoneNumber name');
        watchers.push(...w.map(x => ({ w: x, reason: 'restock' })));
      }
      if (typeof updates.discountPercent !== 'undefined' && Number(updates.discountPercent) > 0) {
        const w = await ProductWatch.find({ product: product._id, type: 'discount', fulfilled: false }).populate('user','phone phoneNumber name');
        watchers.push(...w.map(x => ({ w: x, reason: 'discount' })));
      }
      if (watchers.length) {
        const { sendSms } = require('../services/sms');
        for (const { w, reason } of watchers) {
          const to = w.user?.phoneNumber || w.user?.phone;
          const name = w.user?.name || '';
          const msg = reason === 'restock'
            ? `سلام ${name||'دوست عزیز'}! محصول ${product.name} دوباره موجود شد.`
            : `سلام ${name||'دوست عزیز'}! روی ${product.name} تخفیف فعال شد.`;
          try { if (to) await sendSms(to, msg); } catch (_) {}
          w.fulfilled = true; await w.save();
        }
      }
    } catch (_) {}
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

// جستجوی محصولات با فیلتر پیشرفته و سورت
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, sort = 'newest', page = 1, pageSize = 20 } = req.query;
    const filter = { active: true };
    if (q) {
      // استفاده از text index در صورت موجود بودن؛ fallback به regex
      filter.$or = [
        { $text: { $search: String(q) } },
        { name: new RegExp(String(q), 'i') }
      ];
    }
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...(filter.price||{}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price||{}), $lte: Number(maxPrice) };

    const skip = (Number(page) - 1) * Number(pageSize);

    const sortMap = {
      newest: { createdAt: -1 },
      cheapest: { price: 1 },
      expensive: { price: -1 },
      popular: { 'reviews.length': -1 }
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .select('name price image stock category discountPercent')
        .populate('category', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.success({ products: items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
};

// Suggest با تحمل خطای بهتر + استفاده از text index در امتیازدهی
function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (al === 0) return bl; if (bl === 0) return al;
  const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[al][bl];
}

exports.suggestProducts = async (req, res, next) => {
  try {
    const { q, limit = 8 } = req.query;
    const max = Math.min(Number(limit) || 8, 20);
    if (!q || String(q).trim().length < 1) return res.success({ suggestions: [] });
    const needle = String(q).toLowerCase();
    // ابتدا کاندیدها را از text search بگیریم اگر موجود، سپس fallback عمومی
    let candidates = [];
    try {
      candidates = await Product.find({ $text: { $search: needle } })
        .select('name image price')
        .limit(200)
        .lean();
    } catch (_) {
      candidates = await Product.find({}).select('name image price').limit(500).lean();
    }
    const scored = [];
    for (const c of candidates) {
      const name = String(c.name || '').toLowerCase();
      const d = levenshtein(needle, name.slice(0, Math.min(name.length, needle.length + 3)));
      let score = 100 - d * 10;
      if (name.includes(needle)) score += 30;
      if (name.startsWith(needle)) score += 20;
      // boost بر اساس تخفیف یا جدید بودن
      if (typeof c.discountPercent === 'number' && c.discountPercent > 0) score += 5;
      scored.push({ item: c, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const suggestions = scored.slice(0, max).map(s => s.item);
    res.success({ suggestions });
  } catch (err) { next(err); }
};

// Watch/unwatch endpoints
exports.watchProduct = async (req, res, next) => {
  try {
    const { productId, type } = req.body; // 'restock' | 'discount'
    if (!req.user?.id) return res.fail('ابتدا وارد شوید.', 401);
    if (!['restock','discount'].includes(String(type))) return res.fail('نوع نامعتبر است.', 422);
    await ProductWatch.findOneAndUpdate(
      { user: req.user.id, product: productId, type },
      { $setOnInsert: { fulfilled: false } },
      { upsert: true, new: true }
    );
    res.success({ ok: true });
  } catch (err) { next(err); }
};

exports.unwatchProduct = async (req, res, next) => {
  try {
    const { productId, type } = req.body;
    if (!req.user?.id) return res.fail('ابتدا وارد شوید.', 401);
    await ProductWatch.deleteOne({ user: req.user.id, product: productId, type });
    res.success({ ok: true });
  } catch (err) { next(err); }
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