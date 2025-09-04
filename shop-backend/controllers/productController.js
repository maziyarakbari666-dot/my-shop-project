const Product = require('../models/Product');

exports.addProduct = async (req, res, next) => {
  try {
    const { name, price, category, description, stock } = req.body;
    const image = req.file ? req.file.path : undefined;
    const product = await Product.create({ name, price, category, description, stock, image });
    res.success({ product });
  } catch (err) {
    next(err);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q ? { name: new RegExp(q, 'i') } : {};
    const products = await Product.find(filter).populate('category');
    res.success({ products });
  } catch (err) {
    next(err);
  }
};