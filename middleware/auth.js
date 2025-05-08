const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
require('dotenv').config();

// Authentication middleware
const authenticateUser = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Please sign up or log in to continue',
                action: 'SIGNUP_REQUIRED'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        db.query('SELECT id, username, email, role FROM users WHERE id = ?', 
            [decoded.userId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Server error' });
                }
                
                if (results.length === 0) {
                    return res.status(401).json({ 
                        error: 'User not found',
                        message: 'Please sign up to create an account',
                        action: 'SIGNUP_REQUIRED'
                    });
                }

                req.user = results[0];
                next();
            }
        );
    } catch (error) {
        res.status(401).json({ 
            error: 'Invalid or expired session',
            message: 'Please log in again',
            action: 'LOGIN_REQUIRED'
        });
    }
};

// Check if user exists middleware
const checkUserExists = (req, res, next) => {
    const { email } = req.body;
    
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        
        if (results.length > 0) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists. Please log in instead.',
                action: 'LOGIN_REQUIRED'
            });
        }
        next();
    });
};

// Check if admin exists middleware
const checkAdminExists = (req, res, next) => {
    const { email } = req.body;
    
    db.query('SELECT id FROM admins WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }
        
        if (results.length > 0) {
            return res.status(409).json({
                error: 'Admin already exists',
                message: 'An admin account with this email already exists.',
                action: 'LOGIN_REQUIRED'
            });
        }
        next();
    });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Admin authentication required',
                message: 'Please log in as admin to continue'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.adminId) {
            return res.status(401).json({ 
                error: 'Invalid admin token',
                message: 'Please log in as admin to continue'
            });
        }
        
        db.query('SELECT id, username, email, admin_role FROM admins WHERE id = ?', 
            [decoded.adminId],
            (err, results) => {
                if (err || results.length === 0) {
                    return res.status(401).json({ 
                        error: 'Admin not found',
                        message: 'Admin account not found'
                    });
                }

                req.admin = results[0];
                next();
            }
        );
    } catch (error) {
        res.status(401).json({ 
            error: 'Invalid or expired admin session',
            message: 'Please log in again'
        });
    }
};

// Tutor authentication middleware
const isTutor = (req, res, next) => {
    if (req.user && req.user.role === 'tutor') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Tutor only.' });
    }
};

// Student authentication middleware
const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Student only.' });
    }
};

// Shopper authentication middleware
const isShopper = (req, res, next) => {
    if (req.user && req.user.role === 'shopper') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Shopper only.' });
    }
};

// School authentication middleware
const isSchool = (req, res, next) => {
    if (req.user && req.user.role === 'school') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. School only.' });
    }
};



module.exports = {
    authenticateUser,
    checkUserExists,
    checkAdminExists,
    authenticateAdmin,
    isTutor,
    isStudent,
    isShopper,
    isSchool
};
