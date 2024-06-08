const express = require('express');
const router = express.Router();
const productsApi = require('../../apis/products.api');
const vouchersApi = require('../../apis/vouchers.api');
const authAPI = require('../../apis/auth.api');
const employeeAPI = require('../../apis/employees.api');
const feedbackApi = require('../../apis/feedback.api');
const customersApi = require('../../apis/customers.api');
const categoriesApi = require('../../apis/categories.api');
const statisticsAPI = require('../../apis/statistics.api');
const rolesApi = require('../../apis/roles.api');
const reviewsApi = require('../../apis/reviews.api');


router.use('/products', productsApi);
router.use('/vouchers', vouchersApi);
router.use('/auth', authAPI);
router.use('/employees', employeeAPI);
router.use('/feedback', feedbackApi);
router.use('/customers', customersApi);
router.use('/categories', categoriesApi)
router.use('/statistics', statisticsAPI);
router.use('/roles', rolesApi);
router.use('/reviews', reviewsApi);

module.exports = router;
