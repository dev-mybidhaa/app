const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get paginated books
router.get('/api/books', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        // Get books with pagination
        const [books] = await db.execute(
            'SELECT * FROM books LIMIT ? OFFSET ?',
            [limit, offset]
        );

        // Get total count of books
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM books');
        const totalBooks = countResult[0].total;
        const totalPages = Math.ceil(totalBooks / limit);

        res.json({
            books,
            currentPage: page,
            totalPages,
            totalBooks
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 