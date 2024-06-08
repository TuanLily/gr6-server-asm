const express = require('express');
const router = express.Router();
const connection = require("../../index");
const authenticateJWT = require('./auth.api');

// Lấy danh sách 

router.get('/', authenticateJWT, (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const perPage = 5; 
    const startIndex = (page - 1) * perPage;
    const search = req.query.search || '';

    //truy vấn tìm kiếm sản phẩm
    const searchQuery = `%${search}%`;

    
    const query = `SELECT * FROM roles WHERE name LIKE ? ORDER BY id DESC LIMIT ?, ?`;
    connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const Roles = results;

        
        const countQuery = `
            SELECT COUNT(*) AS total FROM roles WHERE name LIKE ?  
        `;
        connection.query(countQuery, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalRoles = results[0].total;
            const totalPages = Math.ceil(totalRoles / perPage);

            const responseData = {
                currentPage: page,
                totalPages: totalPages,
                roles: Roles
            };

            res.json(responseData);
        });
    });
});

// Lấy theo id
router.get('/:id', (req, res) => {
    const rolesId = req.params.id;
    const query = 'SELECT * FROM roles WHERE id = ?';
    connection.query(query, [rolesId], (err, rows) => {
        if (err) {
            console.error('Error fetching roles:', err);
            res.status(500).send('Error fetching roles');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('roles not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm mới
router.post('/', (req, res) => {
    const { name, status } = req.body;
    const query = 'INSERT INTO roles (name, status) VALUES (?, ?)';
    connection.query(query, [name, status], (err, result) => {
        if (err) {
            console.error('Error adding roles:', err);
            res.status(500).send('Error adding roles');
            return;
        }
        res.json([{ message: 'roles added successfully', }, { id: result.insertId, name, status }]);
    });
});

// Cập nhật 
router.put('/:id', (req, res) => {
    const rolesId = req.params.id;
    const { name, status } = req.body;
    const query = 'UPDATE roles SET name = ?,status = ? WHERE id = ?';
    connection.query(query, [name, status , rolesId], (err, result) => {
        if (err) {
            console.error('Error updating roles:', err);
            res.status(500).send('Error updating roles');
            return;
        }
        res.json({ message: 'roles edited successfully', id: rolesId, name, status });
    });
});

// Cập nhật một phần
router.patch('/:id', (req, res) => {
    const rolesId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE roles SET ? WHERE id = ?';
    connection.query(query, [updatedFields, rolesId], (err, result) => {
        if (err) {
            console.error('Error updating roles:', err);
            res.status(500).send('Error updating roles');
            return;
        }
        res.json({ id: rolesId, ...updatedFields });
    });
});

// Xóa
router.delete('/:id', (req, res) => {
    const rolesId = req.params.id;
    const query = 'DELETE FROM roles WHERE id = ?';
    connection.query(query, [rolesId], (err, result) => {
        if (err) {
            console.error('Error deleting roles:', err);
            res.status(500).send('Error deleting roles');
            return;
        }
        res.json({ id: rolesId, message: 'roles deleted successfully' });
    });
});


module.exports = router;
