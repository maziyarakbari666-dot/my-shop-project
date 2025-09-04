const Product = require('../models/product');

// افزودن محصول جدید
exports.addProduct = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const product = new Product({ name, price, description, stock });
    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};