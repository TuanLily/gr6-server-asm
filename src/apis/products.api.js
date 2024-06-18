const express = require('express');
const router = express.Router();
const connection = require("../../index")
const authenticateJWT = require('./auth.api');



router.get('/', authenticateJWT, (req, res) => {
    const page = parseInt(req.query.page); // Lấy tham số 'page'
    const perPage = 5; // Số sản phẩm trên mỗi trang
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm sản phẩm
    const searchQuery = `%${search}%`;

    // Nếu không có tham số 'page', lấy tất cả sản phẩm
    if (!page) {
        const query = `SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC`;
        connection.query(query, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const products = results;
            const responseData = {
                currentPage: 1,
                totalPages: 1,
                products: products
            };

            res.json(responseData);
        });
    } else {
        const startIndex = (page - 1) * perPage;

        // Truy vấn MySQL để lấy dữ liệu sản phẩm theo trang và tìm kiếm
        const query = `SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC LIMIT ?, ?`;
        connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const products = results;

            // Truy vấn để đếm tổng số sản phẩm phù hợp với điều kiện tìm kiếm
            const countQuery = `SELECT COUNT(*) AS total FROM products WHERE name LIKE ?`;
            connection.query(countQuery, [searchQuery], (err, results) => {
                if (err) {
                    console.error('Error executing MySQL query: ' + err.stack);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const totalProducts = results[0].total;
                const totalPages = Math.ceil(totalProducts / perPage);

                const responseData = {
                    currentPage: page,
                    totalPages: totalPages,
                    products: products
                };

                res.json(responseData);
            });
        });
    }
});


// Lấy một sản phẩm theo id
router.get('/:id', authenticateJWT, (req, res) => {
    const productId = req.params.id;
    const query = 'SELECT * FROM products WHERE id = ?';
    connection.query(query, [productId], (err, rows) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).send('Error fetching product');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Product not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm một sản phẩm mới
router.post('/', authenticateJWT, (req, res) => {
    const { name, price, sale_price, image, category_id } = req.body;
    const query = 'INSERT INTO products (name, price, sale_price, image, category_id) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [name, price, sale_price, image, category_id], (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            res.status(500).send('Error adding product');
            return;
        }
        res.json([{ message: 'Product added successfully', }, { id: result.insertId, name, price, sale_price, image }]);
    });
});

// Cập nhật một sản phẩm
router.put('/:id', authenticateJWT, (req, res) => {
    const productId = req.params.id;
    const { name, price, sale_price, image } = req.body;
    const query = 'UPDATE products SET name = ?, price = ?, sale_price = ?, image = ? WHERE id = ?';
    connection.query(query, [name, price, sale_price, image, productId], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            res.status(500).send('Error updating product');
            return;
        }
        res.json({ message: 'Product edited successfully', id: productId, name, price, sale_price, image });
    });
});

// Cập nhật một phần thông tin của sản phẩm
router.patch('/:id', authenticateJWT, (req, res) => {
    const productId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE products SET ? WHERE id = ?';
    connection.query(query, [updatedFields, productId], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            res.status(500).send('Error updating product');
            return;
        }
        res.json({ id: productId, ...updatedFields });
    });
});

// Xóa một sản phẩm
router.delete('/:id', authenticateJWT, (req, res) => {
    const productId = req.params.id;

    // Thực hiện cập nhật trạng thái của sản phẩm thành "đã xóa" hoặc chuyển vào bảng khác
    const query = 'UPDATE products SET status = 0 WHERE id = ?';

    connection.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            res.status(500).send('Error deleting product');
            return;
        }
        res.json({ message: 'Product deleted successfully' });
    });
});



module.exports = router;
