const express = require('express');
const router = express.Router();
const connection = require("../../index")

// Lấy danh sách sản phẩm
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Products';
    connection.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching Products:', err);
            res.status(500).send('Error fetching Products');
            return;
        }
        res.json(rows);
    });
});

// Lấy một sản phẩm theo id
router.get('/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'SELECT * FROM Products WHERE id = ?';
    connection.query(query, [productId], (err, rows) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).send('Error fetching product');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Product not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm một sản phẩm mới
router.post('/', (req, res) => {
    const { name, price, sale_price, image, category_id } = req.body;
    const query = 'INSERT INTO Products (name, price, sale_price, image, category_id) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [name, price, sale_price, image, category_id], (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            res.status(500).send('Error adding product');
            return;
        }
        res.json([{ message: 'Product added successfully', }, { id: result.insertId, name, price, sale_price, image }]);
    });
});

// Cập nhật một sản phẩm
router.put('/:id', (req, res) => {
    const productId = req.params.id;
    const { name, price, sale_price, image } = req.body;
    const query = 'UPDATE Products SET name = ?, price = ?, sale_price = ?, image = ? WHERE id = ?';
    connection.query(query, [name, price, sale_price, image, productId], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            res.status(500).send('Error updating product');
            return;
        }
        res.json({ message: 'Product edited successfully', id: productId, name, price, sale_price, image });
    });
});

// Cập nhật một phần thông tin của sản phẩm
router.patch('/:id', (req, res) => {
    const productId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE Products SET ? WHERE id = ?';
    connection.query(query, [updatedFields, productId], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            res.status(500).send('Error updating product');
            return;
        }
        res.json({ id: productId, ...updatedFields });
    });
});

// Xóa một sản phẩm
router.delete('/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'DELETE FROM Products WHERE id = ?';
    connection.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            res.status(500).send('Error deleting product');
            return;
        }
        res.json({ id: productId, message: 'Product deleted successfully' });
    });
});

module.exports = router;
