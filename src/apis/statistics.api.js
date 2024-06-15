const express = require('express');
const router = express.Router();
const connection = require("../../index");

router.get('/product-prices', (req, res) => {
    const query = `
        SELECT
            MAX(price) AS maxPrice,
            MIN(price) AS minPrice,
            AVG(price) AS avgPrice
        FROM products
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const {minPrice, maxPrice, avgPrice} = results[0];

        res.json({message: "Success", minPrice: minPrice, maxPrice: maxPrice, avgPrice});
    });
});

router.get('/count-products', (req, res) => {
    const query = `
        SELECT COUNT(*) as count FROM products
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const { count } = results[0];

        res.json({ message: "Success", count: count });
    });
});


module.exports = router;
