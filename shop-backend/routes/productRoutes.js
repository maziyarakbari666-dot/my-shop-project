const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, productSchemas } = require('../middleware/validation');

router.post('/', isAuthenticated, isAdmin, upload.single('image'), validate(productSchemas.add), productController.addProduct);
router.put('/:id', isAuthenticated, isAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, productController.deleteProduct);
router.get('/', validate(productSchemas.list), productController.getAllProducts);
// search endpoints should come before dynamic :id
router.get('/search', productController.searchProducts);
router.get('/search/suggest', productController.suggestProducts);
router.get('/:id', productController.getProduct);
router.post('/watch', isAuthenticated, productController.watchProduct);
router.post('/unwatch', isAuthenticated, productController.unwatchProduct);

// comments
router.post('/comments', productController.addComment);
router.get('/comments', productController.listComments);
router.post('/comments/moderate', isAuthenticated, isAdmin, productController.moderateComment);
router.get('/admin/comments', isAuthenticated, isAdmin, productController.adminListAllReviews);

// validate
router.post('/validate', productController.validateCart);

module.exports = router;