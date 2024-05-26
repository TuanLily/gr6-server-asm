const express = require('express');
const router = express.Router();
const productsApi = require('../../apis/products.api');
const authAPI = require('../../apis/auth.api');

router.use('/auth', authAPI);
router.use('/products', productsApi);

module.exports = router;
