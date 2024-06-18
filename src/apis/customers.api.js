const express = require('express');
const router = express.Router();
const connection = require("../../index")
// Lấy danh sách khách hàng
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Lấy tham số 'page', mặc định là 1 nếu không có
    const perPage = 5; // Số sản phẩm trên mỗi trang
    const startIndex = (page - 1) * perPage;
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm sản phẩm
    const searchQuery = `%${search}%`;

    // Truy vấn MySQL để lấy dữ liệu sản phẩm theo trang và tìm kiếm
    const query = `SELECT * FROM customers WHERE name LIKE ? AND status = 1  ORDER BY id DESC LIMIT ?, ?`;
    connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const customers = results;

        // Truy vấn để đếm tổng số sản phẩm phù hợp với điều kiện tìm kiếm
        const countQuery = `
            SELECT COUNT(*) AS total FROM customers WHERE name LIKE ?  
        `;
        connection.query(countQuery, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalCustomers = results[0].total;
            const totalPages = Math.ceil(totalCustomers / perPage);

            const responseData = {
                currentPage: page,
                totalPages: totalPages,
                customers: customers
            };

            res.json(responseData);
        });
    });
});


// Lấy một khách hàng theo id
router.get('/:id', (req, res) => {
    const customerId = req.params.id;
    const query = 'SELECT * FROM customers WHERE id = ?';
    connection.query(query, [customerId], (err, rows) => {
        if (err) {
            console.error('Error fetching customer:', err);
            res.status(500).send('Error fetching customer');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('customer not found');
            return;
        }
        res.json(rows[0]);
    });
});


// Thêm một khách hàng mới
router.post('/', (req, res) => {
    const { name, username, tel, email, address } = req.body;
    const query = 'INSERT INTO customers ( name, username, tel, email, address) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [ name, username, tel, email, address], (err, result) => {
        if (err) {
            console.error('Error adding customer:', err);
            res.status(500).send('Error adding customer');
            return;
        }
        res.json([{ message: 'customer added successfully', }, { id: result.insertId,  name, username, tel, email, address }]);
    });
});

// Cập nhật một khách hàng
router.put('/:id', (req, res) => {
    const customerId = req.params.id;
    const {  name, username, tel, email, address } = req.body;
    const query = 'UPDATE customers SET name = ?, username = ?, tel = ?, email = ?, address = ? WHERE id = ?';
    connection.query(query, [ name, username, tel, email, address, customerId], (err, result) => {
        if (err) {
            console.error('Error updating customer:', err);
            res.status(500).send('Error updating customer');
            return;
        }
        res.json({ message: 'customer edited successfully', id: customerId,  name, username, tel, email, address });
    });
});

// Cập nhật một phần thông tin của khách hàng
router.patch('/:id', (req, res) => {
    const customerId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE customers SET ? WHERE id = ?';
    connection.query(query, [updatedFields, customerId], (err, result) => {
        if (err) {
            console.error('Error updating customer:', err);
            res.status(500).send('Error updating customer');
            return;
        }
        res.json({ id: customerId, ...updatedFields });
    });
});

// Xóa một khách hàng
router.delete('/:id', (req, res) => {
    const customerId = req.params.id;
    const query = 'UPDATE customers SET status = 0 WHERE id = ?';
    connection.query(query, [customerId], (err, result) => {
        if (err) {
            console.error('Error deleting customer:', err);
            res.status(500).send('Error deleting customer');
            return;
        }
        res.json({ id: customerId, message: 'customer deleted successfully' });
    });
});

module.exports = router;
