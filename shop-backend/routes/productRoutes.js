const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/', productController.addProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

module.exports = router;