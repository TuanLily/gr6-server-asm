const express = require('express');
const router = express.Router();
const connection = require("../../index")
const authenticateJWT = require('./auth.api');

// Lấy danh sách
router.get('/', authenticateJWT, (req, res) => {
    const page = parseInt(req.query.page) || 1; // Lấy tham số 'page', mặc định là 1 nếu không có
    const perPage = 5; // Số lượng trên mỗi trang
    const startIndex = (page - 1) * perPage;
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm 
    const searchQuery = `%${search}%`;

    // Truy vấn MySQL để lấy dữ liệu theo trang và tìm kiếm
    const query = `SELECT * FROM reviews WHERE rate LIKE ? ORDER BY id DESC LIMIT ?, ?`;
    connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const reviews = results;

        const countQuery = `
            SELECT COUNT(*) AS total FROM reviews WHERE rate LIKE ?  
        `;
        connection.query(countQuery, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalReviews = results[0].total;
            const totalPages = Math.ceil(totalReviews / perPage);

            const responseData = {
                currentPage: page,
                totalPages: totalPages,
                reviews: reviews
            };

            res.json(responseData);
        });
    });
});

// Thêm mới
router.post('/', authenticateJWT, (req, res) => {
    const { product_id, customer_id, rate, content } = req.body;
    const query = 'INSERT INTO reviews ( product_id, customer_id, rate, content) VALUES (?, ?, ?, ?)';
    connection.query(query, [ product_id, customer_id, rate, content], (err, result) => {
        if (err) {
            console.error('Error adding reviews:', err);
            res.status(500).send('Error adding reviews');
            return;
        }
        res.json([{ message: 'reviews added successfully', }, { id: result.insertId,  product_id, customer_id, rate, content }]);
    });
});

// Cập nhật 
router.put('/:id', authenticateJWT, (req, res) => {
    const reviewsId = req.params.id;
    const { product_id, customer_id, rate, content } = req.body;
    const query = 'UPDATE reviews SET product_id = ?, customer_id = ?, rate = ?, content = ? WHERE id = ?';
    connection.query(query, [ product_id, customer_id, rate, content, reviewsId], (err, result) => {
        if (err) {
            console.error('Error updating reviews:', err);
            res.status(500).send('Error updating reviews');
            return;
        }
        res.json({ message: 'reviews edited successfully', id: reviewsId,  product_id, customer_id, rate, content });
    });
});

// Cập nhật một phần thông tin
router.patch('/:id', authenticateJWT, (req, res) => {
    const reviewsId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE reviews SET ? WHERE id = ?';
    connection.query(query, [updatedFields, reviewsId], (err, result) => {
        if (err) {
            console.error('Error updating reviews:', err);
            res.status(500).send('Error updating reviews');
            return;
        }
        res.json({ id: reviewsId, ...updatedFields });
    });
});

// Xóa 
router.delete('/:id', authenticateJWT, (req, res) => {
    const reviewsId = req.params.id;
    const query = 'DELETE FROM reviews WHERE id = ?';
    connection.query(query, [reviewsId], (err, result) => {
        if (err) {
            console.error('Error deleting reviews:', err);
            res.status(500).send('Error deleting reviews');
            return;
        }
        res.json({ id: reviewsId, message: 'reviews deleted successfully' });
    });
});

module.exports = router;
