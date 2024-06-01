const express = require('express');
const router = express.Router();
const connection = require("../../index");
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Lấy danh sách nhân viên
router.get('/', (req, res) => {
    const query = 'SELECT * FROM employees';
    connection.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching Employees:', err);
            res.status(500).send('Error fetching Employees');
            return;
        }
        res.json(rows);
    });
});

// Lấy một nhân viên theo id
router.get('/:id', (req, res) => {
    const employeeId = req.params.id;
    const query = 'SELECT * FROM employees WHERE id = ?';
    connection.query(query, [employeeId], (err, rows) => {
        if (err) {
            console.error('Error fetching Employees:', err);
            res.status(500).send('Error fetching Employees');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Employees not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm một nhân viên mới
router.post('/', (req, res) => {
    const { name, username, phone, email, address, password, salary } = req.body;

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Error hashing password');
            return;
        }

    const query = 'INSERT INTO employees (name, username, phone, email, address, password, salary) VALUES (?, ?, ?, ?, ?, ?, ?)';
    connection.query(query, [name, username, phone, email, address, hashedPassword, salary], (err, result) => {
        if (err) {
            console.error('Error adding Employees:', err);
            res.status(500).send('Error adding Employees');
            return;
        }
        res.json([{ message: 'Employees added successfully', }, { id: result.insertId, name, username, phone, email, address, password, salary  }]);
        });
    });
});

// Cập nhật một nhân viên
router.put('/:id', (req, res) => {
    const employeeId = req.params.id;
    const {name, username, phone, email, address, password, salary} = req.body;
    const query = 'UPDATE employees SET name = ?, username=?, phone = ?, email = ?, address = ?, password =?, salary = ? WHERE id = ?';
    connection.query(query, [name, username, phone, email, address, password, salary, employeeId], (err, result) => {
        if (err) {
            console.error('Error updating Employees:', err);
            res.status(500).send('Error updating Employees');
            return;
        }
        res.json({ message: 'Employees edited successfully', id: employeeId, name, username, phone, email, address, password, salary });
    });
});

// Cập nhật một phần thông tin của nhân viên
router.patch('/:id', (req, res) => {
    const employeeId = req.params.id;
    const updates = req.body;
    const query = 'UPDATE employees SET ? WHERE id = ?';
    connection.query(query, [updates, employeeId], (err, result) => {
        if (err) {
            console.error('Error updating Employees:', err);
            res.status(500).send('Error updating Employees');
            return;
        }
        res.json({ id: employeeId });
    });
});

// Xóa một nhân viên
router.delete('/:id', (req, res) => {
    const employeeId = req.params.id;
    const query = 'DELETE FROM employees WHERE id = ?';
    connection.query(query, [employeeId], (err, result) => {
        if (err) {
            console.error('Error deleting Employees:', err);
            res.status(500).send('Error deleting Employees');
            return;
        }
        res.json({ id: employeeId, message: 'Employees deleted successfully' });
    });
});

module.exports = router;
