const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Get electronics with pagination
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Get total count
    db.query('SELECT COUNT(*) as total FROM electronics', (err, countResult) => {
        if (err) {
            console.error('Error getting total count:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get paginated items
        db.query(
            'SELECT * FROM electronics LIMIT ? OFFSET ?',
            [limit, offset],
            (err, results) => {
                if (err) {
                    console.error('Error fetching electronics:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    electronics: results,
                    currentPage: page,
                    totalPages: totalPages,
                    total: total
                });
            }
        );
    });
});

module.exports = router; 