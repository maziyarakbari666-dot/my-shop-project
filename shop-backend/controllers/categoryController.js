const Category = require('../models/Category');

exports.addCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    res.success({ category });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(200, Number(req.query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const filter = {};
    if (q) filter.name = new RegExp(String(q), 'i');
    const [items, total] = await Promise.all([
      Category.find(filter).sort({ name: 1 }).skip(skip).limit(pageSize),
      Category.countDocuments(filter)
    ]);
    res.success({ categories: items, total, page, pageSize });
  } catch (err) {
    next(err);
  }
};