const express = require('express');
const router = express.Router();
const connection = require('../../index');
const authenticateJWT = require('./auth.api');

// Lấy danh sách
router.get('/', authenticateJWT, (req, res) => {
    const page = parseInt(req.query.page); // Lấy tham số 'page'
    const perPage = 5; // Số danh mục trên mỗi trang
    const search = req.query.search || ''; // Lấy tham số 'search', mặc định là chuỗi rỗng nếu không có

    // Câu truy vấn tìm kiếm danh mục
    const searchQuery = `%${search}%`;

    // Nếu không có tham số 'page', lấy tất cả danh mục
    if (!page) {
        const query = `SELECT * FROM categories WHERE name LIKE ? ORDER BY id DESC`;
        connection.query(query, [searchQuery], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const categories = results;
            const responseData = {
                currentPage: 1,
                totalPages: 1,
                categories: categories
            };

            res.json(responseData);
        });
    } else {
        const startIndex = (page - 1) * perPage;

        // Truy vấn MySQL để lấy dữ liệu danh mục theo trang và tìm kiếm
        const query = `SELECT * FROM categories WHERE name LIKE ? ORDER BY id DESC LIMIT ?, ?`;
        connection.query(query, [searchQuery, startIndex, perPage], (err, results) => {
            if (err) {
                console.error('Error executing MySQL query: ' + err.stack);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const categories = results;

            // Truy vấn để đếm tổng số danh mục phù hợp với điều kiện tìm kiếm
            const countQuery = `SELECT COUNT(*) AS total FROM categories WHERE name LIKE ?`;
            connection.query(countQuery, [searchQuery], (err, results) => {
                if (err) {
                    console.error('Error executing MySQL query: ' + err.stack);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const totalCategories = results[0].total;
                const totalPages = Math.ceil(totalCategories / perPage);

                const responseData = {
                    currentPage: page,
                    totalPages: totalPages,
                    categories: categories
                };

                res.json(responseData);
            });
        });
    }
});


// Lấy theo id
router.get('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const query = 'SELECT * FROM categories WHERE id = ?';
    connection.query(query, [categoriesId], (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            res.status(500).send('Error fetching categories');
            return;
        }
        if (rows.length === 0) {
            res.status(404).send('Category not found');
            return;
        }
        res.json(rows[0]);
    });
});

// Thêm mới
router.post('/', (req, res) => {
    const { name, status } = req.body;
    const query = 'INSERT INTO categories (name, status) VALUES (?, ?)';
    connection.query(query, [name, status], (err, result) => {
        if (err) {
            console.error('Error adding category:', err);
            res.status(500).send('Error adding category');
            return;
        }
        res.json([{ message: 'Category added successfully' }, { id: result.insertId, name, status }]);
    });
});

// Cập nhật
router.put('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const { name, status } = req.body;
    const query = 'UPDATE categories SET name = ?, status = ? WHERE id = ?';
    connection.query(query, [name, status, categoriesId], (err, result) => {
        if (err) {
            console.error('Error updating category:', err);
            res.status(500).send('Error updating category');
            return;
        }
        res.json({ message: 'Category edited successfully', id: categoriesId, name, status });
    });
});

// Cập nhật một phần
router.patch('/:id', (req, res) => {
    const categoriesId = req.params.id;
    const updatedFields = req.body;
    const query = 'UPDATE categories SET ? WHERE id = ?';
    connection.query(query, [updatedFields, categoriesId], (err, result) => {
        if (err) {
            console.error('Error updating category:', err);
            res.status(500).send('Error updating category');
            return;
        }
        res.json({ id: categoriesId, ...updatedFields });
    });
});

// Xóa
router.delete('/:id', authenticateJWT, (req, res) => {
    const categoryId = req.params.id;

    // Kiểm tra xem có sản phẩm nào trong danh mục này không
    const checkProductsQuery = 'SELECT COUNT(*) AS productCount FROM products WHERE category_id = ?';

    connection.query(checkProductsQuery, [categoryId], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const productCount = results[0].productCount;

        if (productCount > 0) {
            // Lấy tên danh mục cần xóa
            const getCategoryNameQuery = 'SELECT name FROM categories WHERE id = ?';
            connection.query(getCategoryNameQuery, [categoryId], (err, results) => {
                if (err) {
                    console.error('Error executing MySQL query: ' + err.stack);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: 'Category not found' });
                }

                const categoryName = results[0].name;

                // Cập nhật các sản phẩm thuộc danh mục này thành danh mục có tên khác
                const updateProductsQuery = `UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Chưa Phân Loại') WHERE category_id = ?`;

                connection.query(updateProductsQuery, [categoryId], (err) => {
                    if (err) {
                        console.error('Error executing MySQL query: ' + err.stack);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    // Xóa danh mục sau khi cập nhật sản phẩm
                    const deleteCategoryQuery = 'DELETE FROM categories WHERE id = ?';
                    connection.query(deleteCategoryQuery, [categoryId], (err) => {
                        if (err) {
                            console.error('Error executing MySQL query: ' + err.stack);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        res.status(200).json({ message: 'Category deleted successfully' });
                    });
                });
            });
        } else {
            // Xóa danh mục nếu không có sản phẩm nào
            const deleteCategoryQuery = 'DELETE FROM categories WHERE id = ?';
            connection.query(deleteCategoryQuery, [categoryId], (err) => {
                if (err) {
                    console.error('Error executing MySQL query: ' + err.stack);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.status(200).json({ message: 'Category deleted successfully' });
            });
        }
    });
});

module.exports = router;
