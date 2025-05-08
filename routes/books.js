const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
require('dotenv').config({ path: './config/.env' });

// API route to get paginated books
router.get("/", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countQuery = "SELECT COUNT(*) AS total FROM books";
    const booksQuery = "SELECT book_id, book_title, price, image_url, category FROM books LIMIT ? OFFSET ?";

    db.query(countQuery, (err, countResult) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching total books",
                error: err.message
            });
        }

        // Get total number of books
        const totalBooks = countResult[0].total;
        const totalPages = Math.ceil(totalBooks / limit);

        // Get books for the current page

        db.query(booksQuery, [limit, offset], (err, booksResult) => {
            if (err) {
                return res.status(500).json({
                    message: "Error fetching books",
                    error: err.message
                });
            }

            // Send response with books and pagination info
            res.json({
                books: booksResult,
                total: totalBooks,
                totalPages,
                currentPage: page
            });
        });         
    });
});

module.exports = router;
