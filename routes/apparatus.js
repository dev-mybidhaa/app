const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
require('dotenv').config({ path: './config/.env' });

// API route to get paginated apparatus
router.get("/", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countQuery = "SELECT COUNT(*) AS total FROM apparatus";
    const apparatusQuery = "SELECT apparatus_id, name, price, image_url, category FROM apparatus LIMIT ? OFFSET ?";

    db.query(countQuery, (err, countResult) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching total apparatus",
                error: err.message
            });
        }

        // Get total number of apparatus
        const totalApparatus = countResult[0].total;
        const totalPages = Math.ceil(totalApparatus / limit);

        // Get apparatus for the current page

            db.query(apparatusQuery, [limit, offset], (err, apparatusResult) => {
            if (err) {
                return res.status(500).json({
                    message: "Error fetching apparatus",
                    error: err.message
                });
            }

            // Send response with apparatus and pagination info
            res.json({
                apparatus: apparatusResult,
                total: totalApparatus,
                totalPages,
                currentPage: page
            });
        });         
    });
});

// API route to get science apparatus
router.get("/science", (req, res) => {
    const scienceApparatusQuery = "SELECT id, name, image_url, price FROM science_apparatus";

    db.query(scienceApparatusQuery, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching science apparatus",
                error: err.message
            });
        }

        // Send response with all science apparatus data
        res.json({
            apparatus: result,
            total: result.length
        });
    });
});

module.exports = router;
