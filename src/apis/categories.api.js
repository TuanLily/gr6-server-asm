const express = require('express');
const router = express.Router();
const connection = require("../../index")

// Lấy danh sách 
router.get('/', (req, res) => {
    const query = 'SELECT * FROM categories';
    connection.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            res.status(500).send('Error fetching categories');
            return;
        }
        res.json(rows);
    });
});

// Lấy theo id
router.get('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const query = 'SELECT * FROM categories WHERE id = ?';
    connection.query(query, [categoriesId], (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            res.status(500).send('Error fetching categories');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('categories not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm mới
router.post('/', (req, res) => {
    const { name, status } = req.body;
    const query = 'INSERT INTO categories (name, status) VALUES (?, ?)';
    connection.query(query, [name, status], (err, result) => {
        if (err) {
            console.error('Error adding categories:', err);
            res.status(500).send('Error adding categories');
            return;
        }
        res.json([{ message: 'categories added successfully', }, { id: result.insertId, name, status }]);
    });
});

// Cập nhật 
router.put('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const { name, status } = req.body;
    const query = 'UPDATE categories SET name = ?,status = ? WHERE id = ?';
    connection.query(query, [name, status , categoriesId], (err, result) => {
        if (err) {
            console.error('Error updating categories:', err);
            res.status(500).send('Error updating categories');
            return;
        }
        res.json({ message: 'categories edited successfully', id: categoriesId, name, status });
    });
});

// Cập nhật một phần
router.patch('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE categories SET ? WHERE id = ?';
    connection.query(query, [updatedFields, categoriesId], (err, result) => {
        if (err) {
            console.error('Error updating categories:', err);
            res.status(500).send('Error updating categories');
            return;
        }
        res.json({ id: categoriesId, ...updatedFields });
    });
});

// Xóa
router.delete('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const query = 'DELETE FROM categories WHERE id = ?';
    connection.query(query, [categoriesId], (err, result) => {
        if (err) {
            console.error('Error deleting categories:', err);
            res.status(500).send('Error deleting categories');
            return;
        }
        res.json({ id: categoriesId, message: 'categories deleted successfully' });
    });
});

module.exports = router;
