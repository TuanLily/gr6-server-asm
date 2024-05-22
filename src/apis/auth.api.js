const express = require('express');
const router = express.Router();
const connection = require("../../index");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;




// Endpoint để lấy thông tin tài khoản qua email
// router.post('/login', (req, res) => {
//     const { email, password } = req.body;
//     const query = 'SELECT * FROM Employees WHERE email = ?';

//     connection.query(query, [email], (err, rows) => {
//         if (err) {
//             console.error('Error fetching user:', err);
//             res.status(500).send('Error fetching user');
//             return;
//         }
//         if (rows.length === 0) {
//             res.status(404).send('Invalid email or password');
//             return;
//         }

//         const user = rows[0];
//         if (user.password !== password) {
//             res.status(401).send('Invalid email or password');
//             return;
//         }

//         res.json({ name: user.name, token: 'fake-jwt-token' }); // Thay thế bằng token thực tế
//     });
// }); //! Chức năng login bằng mật khẩu bình thường

router.post('/login', (req, res) => {
    const { email, password, rememberMe } = req.body;
    const query = 'SELECT * FROM Employees WHERE email = ?';

    connection.query(query, [email], (err, rows) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Error fetching user');
        }

        if (rows.length === 0) {
            return res.status(404).send('Invalid email or password');
        }

        const user = rows[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ status: 'error', message: 'Error comparing passwords' });
            }

            if (!isMatch) {
                return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
            }

            // Tạo access token có thời hạn 1 giờ
            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name, username: user.username },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Nếu rememberMe được chọn, tạo thêm refresh token có thời hạn 15 ngày
            if (rememberMe) {
                const refreshToken = jwt.sign(
                    { id: user.id, email: user.email, name: user.name, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '15d' }
                );
                return res.json({ name: user.username, token, refreshToken });
            } else {
                return res.json({ name: user.username, token });
            }
        });
    });
});//! Chức năng login bằng mật khẩu mã hóa bcrypt và tạo mã jwt

// Middleware để xác thực JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).send('Token is not valid');
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).send('Token is required');
    }
};

// Một route được bảo vệ bằng JWT
router.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: `Hello ${req.user.name}, this is a protected route!` });
});

// Endpoint để làm mới token
router.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).send('Yêu cầu phải có refresh token');
    }

    jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).send('Refresh token đã hết hạn');
            }
            // Thêm điều kiện để báo lỗi cụ thể khi refreshToken không hợp lệ
            return res.status(401).send('Refresh token không hợp lệ hoặc token đã hết hạn');
        }

        // Tạo access token mới
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' } // thời hạn mới cho access token
        );

        res.json({ token: newAccessToken });
    });
});



// Endpoint: Quên mật khẩu
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    const query = 'SELECT * FROM Employees WHERE email = ?';
    connection.query(query, [email], (err, rows) => {
        if (err) {
            console.error('Lỗi khi lấy người dùng:', err);
            res.status(500).send({ status: 500, message: 'Lỗi khi lấy người dùng' });
            return;
        }

        if (rows.length === 0) {
            res.status(404).send({ status: 404, message: 'Email không tồn tại trong hệ thống' });
            return;
        }

        // Tạo mã thông báo đặt lại mật khẩu và thời gian hết hạn
        const resetToken = Math.random().toString(36).substr(2);
        const resetTokenExpiration = Date.now() + 120000; // 2 phút

        // Cập nhật người dùng với mã thông báo đặt lại và thời gian hết hạn
        const updateQuery = 'UPDATE Employees SET resetToken = ?, resetTokenExpiration = ? WHERE email = ?';
        connection.query(updateQuery, [resetToken, resetTokenExpiration, email], (err, result) => {
            if (err) {
                console.error('Lỗi khi cập nhật người dùng với mã thông báo đặt lại:', err);
                res.status(500).send({ status: 500, message: 'Lỗi khi cập nhật người dùng' });
                return;
            }

            // Gửi email với mã thông báo đặt lại
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: email,
                subject: 'Dom Tea - Đặt lại mật khẩu',
                text: `Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.\n\n
                Vui lòng sử dụng liên kết sau để đặt lại mật khẩu:\n\n
                http://localhost:61700/auth/reset-password?token=${resetToken}\n\n
                *Xin lưu ý rằng liên kết này chỉ có hiệu lực trong vòng 2 phút và không được chia sẻ với bất kỳ ai khác.\n\n
                (Nếu bạn không yêu cầu việc đặt lại mật khẩu, vui lòng bỏ qua email này)\n`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi khi gửi email:', error);
                    res.status(500).send({ status: 500, message: 'Lỗi khi gửi email' });
                } else {
                    res.status(200).send({ status: 200, message: 'Email đặt lại mật khẩu đã được gửi' });
                }
            });
        });
    });
});


// Endpoint: Đặt lại mật khẩu
router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    const query = 'SELECT * FROM Employees WHERE resetToken = ? AND resetTokenExpiration > ?';
    connection.query(query, [token, Date.now()], (err, rows) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin tài khoản với mã token:', err);
            return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thông tin tài khoản' });
        }

        if (rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Mã token không hợp lệ hoặc đã hết hạn' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const updateQuery = 'UPDATE Employees SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE resetToken = ?';
        connection.query(updateQuery, [hashedPassword, token], (err, result) => {
            if (err) {
                console.error('Lỗi khi cập nhật mật khẩu tài khoản:', err);
                return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật mật khẩu tài khoản' });
            }

            return res.status(200).json({ status: 'success', message: 'Mật khẩu reset thành công' });
        });
    });
});



module.exports = router;