const express = require('express');
const router = express.Router();
const productsApi = require('../../apis/products.api');
const vouchersApi = require('../../apis/vouchers.api');
const authAPI = require('../../apis/auth.api');
const employeeAPI = require('../../apis/employees.api');
const feedbackApi = require('../../apis/feedback.api');
const customersApi = require('../../apis/customers.api');

router.use('/products', productsApi);
router.use('/vouchers', vouchersApi);
router.use('/auth', authAPI);
router.use('/employees', employeeAPI);
router.use('/feedback', feedbackApi);
router.use('/customers', customersApi);

module.exports = router;
