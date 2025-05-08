const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
require('dotenv').config({ path: './config/.env' });

// Add this check at the top of the file
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, phone_number, password, role } = req.body;
        
        // Validate required fields
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate role
        const allowedRoles = ['student', 'tutor', 'shopper', 'school', 'parent_student'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role selected'
            });
        }

        // Check if email already exists
        db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error during email check:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered'
                });
            }

            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert new user
                const query = 'INSERT INTO users (username, email, phone_number, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
                db.query(query, 
                    [username, email, phone_number, hashedPassword, role], 
                    (err, results) => {
                        if (err) {
                            console.error('Error inserting new user:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Could not create user account'
                            });
                        }

                        // Create token
                        const token = jwt.sign(
                            { userId: results.insertId, role: role },
                            process.env.JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        res.status(201).json({
                            success: true,
                            message: 'Registration successful',
                            token,
                            user: {
                                id: results.insertId,
                                username,
                                email,
                                role
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('Error during user creation:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error creating user account'
                });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

// Admin Registration
router.post('/admin/register', async (req, res) => {
    try {
        const { username, email, phone_number, password, admin_role } = req.body;

        // Check if admin already exists
        db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    error: 'Registration failed',
                    message: 'Database error occurred'
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    error: 'Registration failed',
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new admin
            const query = 'INSERT INTO admins (username, email, phone_number, password, admin_role) VALUES (?, ?, ?, ?, ?)';
            db.query(query, [username, email, phone_number, hashedPassword, admin_role], (err, results) => {
                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({
                        error: 'Registration failed',
                        message: 'Could not create admin account'
                    });
                }

                // Create token
                const token = jwt.sign(
                    { adminId: results.insertId, role: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'Admin registration successful',
                    token,
                    user: {
                        id: results.insertId,
                        username,
                        email,
                        role: 'admin',
                        admin_role
                    }
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Server error occurred'
        });
    }
});

// Login (handles both users and admins)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // First try user login
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, userResults) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        // If not found in users table, try admins table
        if (userResults.length === 0) {
            db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, adminResults) => {
                if (err) {
                    console.error('Database error during admin login:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error occurred'
                    });
                }

                if (adminResults.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }

                const admin = adminResults[0];
                const passwordMatch = await bcrypt.compare(password, admin.password);

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }

                // Update last login time
                db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

                const token = jwt.sign(
                    { adminId: admin.id, role: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({
                    success: true,
                    message: 'Login successful',
                    redirect: '/index.html',
                    token,
                    user: {
                        id: admin.id,
                        username: admin.username,
                        email: admin.email,
                        role: 'admin',
                        admin_role: admin.admin_role
                    }
                });
            });
            return;
        }

        // Handle user login
        const user = userResults[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login time
        db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            redirect: '/index.html',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    });
});

module.exports = router;
