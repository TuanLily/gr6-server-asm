const express = require('express');
const router = express.Router();
const connection = require("../../index");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const authenticateJWT = require('./auth.api');

// Lấy danh sách nhân viên
router.get('/', authenticateJWT, (req, res) => {
    const page = parseInt(req.query.page); // Lấy tham số 'page'
    const perPage = 5; // Số nhân viên trên mỗi trang
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm nhân viên
    const searchQuery = `%${search}%`;

    // Nếu không có tham số 'page', lấy tất cả nhân viên
    if (!page) {
        const query = `SELECT * FROM employees WHERE name LIKE ? ORDER BY id DESC`;
        connection.query(query, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const employees = results;
            const responseData = {
                currentPage: 1,
                totalPages: 1,
                employees: employees
            };

            res.json(responseData);
        });
    } else {
        const startIndex = (page - 1) * perPage;

        // Truy vấn MySQL để lấy dữ liệu nhân viên theo trang và tìm kiếm
        const query = `SELECT * FROM employees WHERE name LIKE ? ORDER BY id DESC LIMIT ?, ?`;
        connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const employees = results;

            // Truy vấn để đếm tổng số nhân viên phù hợp với điều kiện tìm kiếm
            const countQuery = `SELECT COUNT(*) AS total FROM employees WHERE name LIKE ?`;
            connection.query(countQuery, [searchQuery], (err, results) => {
                if (err) {
                    console.error('Error executing MySQL query: ' + err.stack);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const totalEmployees = results[0].total;
                const totalPages = Math.ceil(totalEmployees / perPage);

                const responseData = {
                    currentPage: page,
                    totalPages: totalPages,
                    employees: employees
                };

                res.json(responseData);
            });
        });
    }
});


// Lấy một nhân viên theo id
router.get('/:id', authenticateJWT, (req, res) => {
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
router.post('/', authenticateJWT, (req, res) => {
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
router.put('/:id', authenticateJWT, (req, res) => {
    const employeeId = req.params.id;
    const { name, username, phone, email, address, password, salary } = req.body;

    const updateEmployee = (hashedPassword) => {
        const query = 'UPDATE employees SET name = ?, username = ?, phone = ?, email = ?, address = ?, password = ?, salary = ? WHERE id = ?';
        connection.query(query, [name, username, phone, email, address, hashedPassword, salary, employeeId], (err, result) => {
            if (err) {
                console.error('Lỗi khi cập nhật nhân viên:', err);
                res.status(500).send('Lỗi khi cập nhật nhân viên');
                return;
            }
            res.json({ message: 'Cập nhật nhân viên thành công', id: employeeId, name, username, phone, email, address, password, salary });
        });
    };

    if (password) {
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Lỗi khi mã hóa mật khẩu:', err);
                res.status(500).send('Lỗi khi mã hóa mật khẩu');
                return;
            }
            updateEmployee(hashedPassword);
        });
    } else {
        // Nếu không có mật khẩu được cung cấp, lấy mật khẩu hiện tại từ cơ sở dữ liệu
        const query = 'SELECT password FROM employees WHERE id = ?';
        connection.query(query, [employeeId], (err, results) => {
            if (err) {
                console.error('Lỗi khi lấy mật khẩu hiện tại:', err);
                res.status(500).send('Lỗi khi lấy mật khẩu hiện tại');
                return;
            }
            if (results.length > 0) {
                updateEmployee(results[0].password);
            } else {
                res.status(404).send('Không tìm thấy nhân viên');
            }
        });
    }
});

// Cập nhật một phần thông tin của nhân viên
router.patch('/:id', authenticateJWT, (req, res) => {
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
router.delete('/:id', authenticateJWT, (req, res) => {
    const employeeId = req.params.id;
    const query = 'UPDATE employees SET status = 0 WHERE id = ?';
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
