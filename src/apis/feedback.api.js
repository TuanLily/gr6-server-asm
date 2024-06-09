const express = require('express');
const router = express.Router();
const connection = require("../../index");

// Lấy danh sách đánh giá
// router.get('/', (req, res) => {
//     const query = 'SELECT * FROM feedback';
//     connection.query(query, (err, rows) => {
//         if (err) {
//             console.error('Error fetching feedback:', err);
//             res.status(500).send('Error fetching feedback');
//             return;
//         }
//         res.json(rows);
//     });
// });

router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Lấy tham số 'page', mặc định là 1 nếu không có
    const perPage = 5; // Số sản phẩm trên mỗi trang
    const startIndex = (page - 1) * perPage;
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm sản phẩm
    const searchQuery = `%${search}%`;


    // const query = `SELECT * FROM feedback WHERE customer_id LIKE ? ORDER BY id DESC LIMIT ?, ?`;
    const query = `
    SELECT feedback.*, customers.name AS customer_name FROM feedback JOIN customers ON feedback.customer_id = customers.id WHERE customers.name LIKE ? ORDER BY feedback.id DESC LIMIT ?,?`;
    connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
        if (err) {
            console.error('Error fetching feedback:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const feedback = results;

        const countQuery = `
        SELECT COUNT(*) AS total 
            FROM feedback 
            JOIN customers ON feedback.customer_id = customers.id 
            WHERE customers.name LIKE ?  
    `;
        connection.query(countQuery, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalProducts = results[0].total;
            const totalPages = Math.ceil(totalProducts / perPage);

            const responseData = {
                currentPage: page,
                totalPages: totalPages,
                feedback: feedback
            };

            res.json(responseData);
        });


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
    const { content, customer_id } = req.body;
    const query = 'INSERT INTO feedback (content, customer_id) VALUES (?, ?)';
    connection.query(query, [content, customer_id], (err, result) => {
        if (err) {
            console.error('Error adding feedback:', err);
            res.status(500).send('Error adding feedback');
            return;
        }
        res.json([{ message: 'feedback added successfully', }, { id: result.insertId, content }]);
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

