const express = require('express');
const router = express.Router();
const productsApi = require('../../apis/products.api');
const authAPI = require('../../apis/auth.api');

router.use('/products', productsApi);
router.use('/auth', authAPI);

module.exports = router;
