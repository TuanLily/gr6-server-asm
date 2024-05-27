const express = require('express');
const router = express.Router();
const productsApi = require('../../apis/products.api');
const vouchersApi = require('../../apis/vouchers.api');
const authAPI = require('../../apis/auth.api');

router.use('/products', productsApi);
router.use('/vouchers', vouchersApi);
router.use('/auth', authAPI);

module.exports = router;
