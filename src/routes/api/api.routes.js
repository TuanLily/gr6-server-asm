const express = require('express');
const router = express.Router();
const productsApi = require('../../apis/products.api');

router.use('/products', productsApi);

module.exports = router;
