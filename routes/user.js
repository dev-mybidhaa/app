const express = require('express');
const router = express.Router();

// Define your user routes here
router.get('/', (req, res) => {
    res.json({ message: 'User routes working' });
});

// Export the router (not an object)
module.exports = router;

// User authentication routes

// User profile routes

// User order routes

// User payment routes
