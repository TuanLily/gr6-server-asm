const express = require('express');
const router = express.Router();
const connection = require("../../index");

// Lấy danh sách đánh giá
router.get('/', (req, res) => {
    const query = 'SELECT * FROM feedback';
    connection.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching feedback:', err);
            res.status(500).send('Error fetching feedback');
            return;
        }
        res.json(rows);
    });
});

// Lấy một đánh giá theo id
router.get('/:id', (req, res) => {
    const feedbackId = req.params.id;
    const query = 'SELECT * FROM feedback WHERE id = ?';
    connection.query(query, [feedbackId], (err, rows) => {
        if (err) {
            console.error('Error fetching feedback:', err);
            res.status(500).send('Error fetching feedback');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('feedback not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm một đánh giá mới
router.post('/', (req, res) => {
    const { content,  customer_id} = req.body;
    const query = 'INSERT INTO feedback (content, customer_id) VALUES (?, ?)';
    connection.query(query, [content, customer_id], (err, result) => {
        if (err) {
            console.error('Error adding feedback:', err);
            res.status(500).send('Error adding feedback');
            return;
        }
        res.json([{ message: 'feedback added successfully', }, { id: result.insertId, content}]);
    });
});

// Cập nhật một sản phẩm
router.put('/:id', (req, res) => {
    const feedbackId = req.params.id;
    const { content } = req.body;
    const query = 'UPDATE feedback SET content = ? WHERE id = ?';
    connection.query(query, [content, feedbackId], (err, result) => {
        if (err) {
            console.error('Error updating feedback:', err);
            res.status(500).send('Error updating feedback');
            return;
        }
        res.json({ message: 'feedback edited successfully', id: feedbackId, content });
    });
});

// Cập nhật một phần thông tin của sản phẩm
router.patch('/:id', (req, res) => {
    const feedbackId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE feedback SET ? WHERE id = ?';
    connection.query(query, [updatedFields, feedbackId], (err, result) => {
        if (err) {
            console.error('Error updating feedback:', err);
            res.status(500).send('Error updating feedback');
            return;
        }
        res.json({ id: feedbackId, ...updatedFields });
    });
});

// Xóa một sản phẩm
router.delete('/:id', (req, res) => {
    const feedbackId = req.params.id;
    const query = 'DELETE FROM feedback WHERE id = ?';
    connection.query(query, [feedbackId], (err, result) => {
        if (err) {
            console.error('Error deleting feedback:', err);
            res.status(500).send('Error deleting feedback');
            return;
        }
        res.json({ id: feedbackId, message: 'feedback deleted successfully' });
    });
});

module.exports = router;

