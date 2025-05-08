const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateAdmin = async (req, res, next) => {
    try {
        console.log('Cookies received:', req.cookies); // Debug cookies
        
        const token = req.cookies.adminToken;
        
        if (!token) {
            console.log('No token found');
            return res.status(401).json({ message: 'No authentication token found' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Debug decoded token

        // Get admin from database to ensure they still exist
        const [admins] = await db.query('SELECT * FROM admins WHERE id = ?', [decoded.id]);
        
        if (admins.length === 0) {
            console.log('No admin found for id:', decoded.id);
            return res.status(401).json({ message: 'Admin not found' });
        }

        const admin = admins[0];
        console.log('Admin found:', { id: admin.id, role: admin.admin_role }); // Debug admin

        // Add admin info to request
        req.admin = {
            id: admin.id,
            email: admin.email,
            admin_role: admin.admin_role
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ 
            message: 'Authentication failed', 
            error: error.message 
        });
    }
};

module.exports = { authenticateAdmin }; 