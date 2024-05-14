const express = require('express');
const router = express.Router();
const connection = require("../../index")

// Endpoint để lấy thông tin tài khoản qua email
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM Employees WHERE email = ?';

    connection.query(query, [email], (err, rows) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).send('Error fetching user');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Invalid email or password');
            return;
        }

        const user = rows[0];
        if (user.password !== password) {
            res.status(401).send('Invalid email or password');
            return;
        }

        res.json({ name: user.name, token: 'fake-jwt-token' }); // Thay thế bằng token thực tế
    });
});


module.exports = router;