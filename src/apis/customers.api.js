const express = require('express');
const router = express.Router();
const connection = require("../../index")

// Lấy danh sách khách hàng
router.get('/', (req, res) => {
    const query = 'SELECT * FROM customers';
    connection.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching customers:', err);
            res.status(500).send('Error fetching customers');
            return;
        }
        res.json(rows);
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
    const query = 'DELETE FROM customers WHERE id = ?';
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
