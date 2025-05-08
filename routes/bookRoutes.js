const express = require('express');
const router = express.Router();
const db = require('../server/config/db');

// Add this to your existing book routes
router.get('/image/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT image FROM books WHERE id = ?', [req.params.id]);
        
        if (rows.length === 0 || !rows[0].image) {
            return res.status(404).send('Image not found');
        }

        // Set appropriate content type
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(rows[0].image);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Error fetching image');
    }
});

module.exports = router; 