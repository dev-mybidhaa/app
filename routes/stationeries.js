const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
require('dotenv').config({ path: './config/.env' });

// API route to get stationeries with pagination
router.get("/", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const countQuery = "SELECT COUNT(*) AS total FROM stationeries";
    const stationeriesQuery = "SELECT * FROM stationeries LIMIT ? OFFSET ?";

    db.query(countQuery, (err, countResult) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching total stationeries",
                error: err.message
            });
        }

        // Get total number of stationeries
        const totalStationeries = countResult[0].total;
        const totalPages = Math.ceil(totalStationeries / limit);

        // Get stationeries for the current page
        db.query(stationeriesQuery, [limit, offset], (err, stationeriesResult) => {
            if (err) {
                return res.status(500).json({
                    message: "Error fetching stationeries",
                    error: err.message
                });
            }

            // Send response with stationeries and pagination info
            res.json({
                stationeries: stationeriesResult,
                total: totalStationeries,
                totalPages,
                currentPage: page
            });
        });         
    });
});

module.exports = router; 