const express = require('express');
const router = express.Router();
const connection = require("../../index");

// Lấy danh sách voucher với tìm kiếm và phân trang
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Lấy tham số 'page', mặc định là 1 nếu không có
    const perPage = 5; // Số voucher trên mỗi trang
    const startIndex = (page - 1) * perPage;
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm voucher
    const searchQuery = `%${search}%`;

    // Truy vấn MySQL để lấy dữ liệu voucher theo trang và tìm kiếm
    const query = `SELECT * FROM vouchers WHERE voucher_code LIKE ? ORDER BY id DESC LIMIT ?, ?`;
    connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const vouchers = results;

        // Truy vấn để đếm tổng số voucher phù hợp với điều kiện tìm kiếm
        const countQuery = `SELECT COUNT(*) AS total FROM vouchers WHERE voucher_code LIKE ?`;
        connection.query(countQuery, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalVouchers = results[0].total;
            const totalPages = Math.ceil(totalVouchers / perPage);

            const responseData = {
                currentPage: page,
                totalPages: totalPages,
                vouchers: vouchers
            };

            res.json(responseData);
        });
    });
});

// Lấy một voucher theo id
router.get('/:id', (req, res) => {
    const voucherId = req.params.id;
    const query = 'SELECT * FROM vouchers WHERE id = ?';
    connection.query(query, [voucherId], (err, rows) => {
        if (err) {
            console.error('Error fetching voucher:', err);
            res.status(500).send('Error fetching voucher');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Voucher not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm một voucher mới
router.post('/', (req, res) => {
    const { voucher_code, discount_rate, valid_from, valid_to, description } = req.body;
    
    // Kiểm tra xem voucher_code có được cung cấp không
    if (!voucher_code) {
        res.status(400).send('Voucher code is required');
        return;
    }

    const query = 'INSERT INTO vouchers (voucher_code, discount_rate, valid_from, valid_to, description) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [voucher_code, discount_rate, valid_from, valid_to, description], (err, result) => {
        if (err) {
            console.error('Error adding voucher:', err);
            res.status(500).send('Error adding voucher');
            return;
        }
        res.json([{ message: 'Voucher added successfully', }, { id: result.insertId, voucher_code, discount_rate, valid_from, valid_to, description }]);
    });
});

// Cập nhật một voucher
router.put('/:id', (req, res) => {
    const voucherId = req.params.id;
    const { voucher_code, discount_rate, valid_from, valid_to, description } = req.body;
    const query = 'UPDATE vouchers SET voucher_code = ?, discount_rate = ?, valid_from = ?, valid_to = ?, description = ? WHERE id = ?';
    connection.query(query, [voucher_code, discount_rate, valid_from, valid_to, description, voucherId], (err, result) => {
        if (err) {
            console.error('Error updating voucher:', err);
            res.status(500).send('Error updating voucher');
            return;
        }
        res.json({ message: 'Voucher edited successfully', id: voucherId, voucher_code, discount_rate, valid_from, valid_to, description });
    });
});

// Cập nhật một phần thông tin của voucher
router.patch('/:id', (req, res) => {
    const voucherId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE vouchers SET ? WHERE id = ?';
    connection.query(query, [updatedFields, voucherId], (err, result) => {
        if (err) {
            console.error('Error updating voucher:', err);
            res.status(500).send('Error updating voucher');
            return;
        }
        res.json({ id: voucherId, ...updatedFields });
    });
});

// Xóa một voucher
router.delete('/:id', (req, res) => {
    const voucherId = req.params.id;
    const query = 'DELETE FROM vouchers WHERE id = ?';
    connection.query(query, [voucherId], (err, result) => {
        if (err) {
            console.error('Error deleting voucher:', err);
            res.status(500).send('Error deleting voucher');
            return;
        }
        res.json({ id: voucherId, message: 'Voucher deleted successfully' });
    });
});

module.exports = router;
