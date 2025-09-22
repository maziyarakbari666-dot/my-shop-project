const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', isAuthenticated, isAdmin, upload.single('image'), productController.addProduct);
router.put('/:id', isAuthenticated, isAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, productController.deleteProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// comments
router.post('/comments', productController.addComment);
router.get('/comments', productController.listComments);
router.post('/comments/moderate', isAuthenticated, isAdmin, productController.moderateComment);
router.get('/admin/comments', isAuthenticated, isAdmin, productController.adminListAllReviews);

// validate
router.post('/validate', productController.validateCart);

module.exports = router;