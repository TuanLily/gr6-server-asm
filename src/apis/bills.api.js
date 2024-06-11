const express = require('express');
const router = express.Router();
const connection = require("../../index");

// Lấy danh sách bills với tìm kiếm và phân trang
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Lấy tham số 'page', mặc định là 1 nếu không có
    const perPage = 5; // Số bills trên mỗi trang
    const startIndex = (page - 1) * perPage;
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm bills
    const searchQuery = `%${search}%`;

    // Truy vấn MySQL để lấy dữ liệu bills theo trang và tìm kiếm
    const query = `SELECT * FROM bills WHERE customer_name LIKE ? ORDER BY id DESC LIMIT ?, ?`;
    connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const bills = results;

        // Truy vấn để đếm tổng số bills phù hợp với điều kiện tìm kiếm
        const countQuery = `SELECT COUNT(*) AS total FROM bills WHERE customer_name LIKE ?`;
        connection.query(countQuery, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalBills = results[0].total;
            const totalPages = Math.ceil(totalBills / perPage);

            const responseData = {
                currentPage: page,
                totalPages: totalPages,
                bills: bills
            };

            res.json(responseData);
        });
    });
});

// Lấy một bill theo id
router.get('/:id', (req, res) => {
    const billId = req.params.id;
    const query = 'SELECT * FROM bills WHERE id = ?';
    connection.query(query, [billId], (err, rows) => {
        if (err) {
            console.error('Error fetching bill:', err);
            res.status(500).send('Error fetching bill');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Bill not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm một bill mới
router.post('/', (req, res) => {
    const { product_id, qty, customer_name, employee_id, voucher_code } = req.body;

    // Kiểm tra xem product_id có được cung cấp không
    if (!product_id) {
        res.status(400).send('Product ID is required');
        return;
    }

    // Truy vấn để lấy thông tin sản phẩm và voucher
    const productQuery = 'SELECT price FROM products WHERE id = ?';
    const voucherQuery = 'SELECT discount_rate FROM vouchers WHERE code = ?';

    connection.query(productQuery, [product_id], (err, productResults) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).send('Error fetching product');
            return;
        }

        const price = productResults[0].price;
        const provisionalTotal = price * qty;

        connection.query(voucherQuery, [voucher_code], (err, voucherResults) => {
            let discountAmount = 0;
            if (!err && voucherResults.length > 0) {
                const discountRate = voucherResults[0].discount_rate;
                discountAmount = provisionalTotal * (discountRate / 100);
            }

            const total = provisionalTotal - discountAmount;

            const query = 'INSERT INTO bills (product_id, qty, total, customer_name, employee_id, voucher_code) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(query, [product_id, qty, total, customer_name, employee_id, voucher_code], (err, result) => {
                if (err) {
                    console.error('Error adding bill:', err);
                    res.status(500).send('Error adding bill');
                    return;
                }
                res.json([{ message: 'Bill added successfully' }, { id: result.insertId, product_id, qty, total, customer_name, employee_id, voucher_code }]);
            });
        });
    });
});

// Cập nhật một bill
router.put('/:id', (req, res) => {
    const billId = req.params.id;
    const { product_id, qty, total, customer_name, employee_id, voucher_code } = req.body;
    const query = 'UPDATE bills SET product_id = ?, qty = ?, total = ?, customer_name = ?, employee_id = ?, voucher_code = ? WHERE id = ?';
    connection.query(query, [product_id, qty, total, customer_name, employee_id, voucher_code, billId], (err, result) => {
        if (err) {
            console.error('Error updating bill:', err);
            res.status(500).send('Error updating bill');
            return;
        }
        res.json({ message: 'Bill edited successfully', id: billId, product_id, qty, total, customer_name, employee_id, voucher_code });
    });
});

// Cập nhật một phần thông tin của bill
router.patch('/:id', (req, res) => {
    const billId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE bills SET ? WHERE id = ?';
    connection.query(query, [updatedFields, billId], (err, result) => {
        if (err) {
            console.error('Error updating bill:', err);
            res.status(500).send('Error updating bill');
            return;
        }
        res.json({ id: billId, ...updatedFields });
    });
});

// Xóa một bill
router.delete('/:id', (req, res) => {
    const billId = req.params.id;
    const query = 'DELETE FROM bills WHERE id = ?';
    connection.query(query, [billId], (err, result) => {
        if (err) {
            console.error('Error deleting bill:', err);
            res.status(500).send('Error deleting bill');
            return;
        }
        res.json({ id: billId, message: 'Bill deleted successfully' });
    });
});

module.exports = router;
