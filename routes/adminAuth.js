const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { db } = require('../config/db');

// Middleware to check if user is authenticated as admin
const authenticateAdmin = (req, res, next) => {
    try {
        const token = req.cookies.adminToken;

    if (!token) {
            return res.status(401).json({ message: 'Access denied. Please login.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const query = 'SELECT id, username, email, admin_role FROM admins WHERE id = ?';
            db.query(query, [decoded.adminId], (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Internal server error' });
                }

                if (results.length === 0) {
                    return res.status(401).json({ message: 'Invalid admin account' });
                }

                req.admin = {
                    ...decoded,
                    ...results[0]
                };
        next();
            });
        } catch (error) {
            res.clearCookie('adminToken');
            res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Serve admin login page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/adminLogin.html'));
});

// Serve admin dashboard (protected route)
router.get('/dashboard', authenticateAdmin, (req, res) => {
    console.log('Serving dashboard for admin:', req.admin.username);
    res.sendFile(path.join(__dirname, '../public/admin/adminDashboard.html'));
});

// Update the dashboard routes
router.post('/dashboard', authenticateAdmin, (req, res) => {
    console.log('POST to dashboard with token');
    res.sendFile(path.join(__dirname, '../public/admin/adminDashboard.html'));
});

// Add a route to verify authentication status
router.get('/verify-auth', authenticateAdmin, (req, res) => {
    console.log('Verifying auth for admin:', req.admin.username);
    res.json({
        authenticated: true,
        admin: {
            username: req.admin.username,
            email: req.admin.email,
            role: req.admin.admin_role
        }
    });
});

// Admin Registration (Protected - Super Admin Only)
router.post('/register', authenticateAdmin, async (req, res) => {
    try {
        console.log('Received registration request:', req.body);
        // Check if the requesting admin is a super_admin
        if (req.admin.admin_role !== 'super_admin') {
            console.log('Registration attempt by non-super admin:', req.admin.username);
            return res.status(403).json({
                message: 'Only super admins can register new admins'
            });
        }

        const { username, email, phone_number, password, admin_role } = req.body;
        
        // Debug logs
        console.log('Received registration request with role:', admin_role);
        console.log('Request body:', { ...req.body, password: '[HIDDEN]' });

        // Validate admin role
        const validRoles = ['super_admin', 'manager', 'support', 'sales', 'finance'];
        
        // Debug log for role validation
        console.log('Role validation:', {
            receivedRole: admin_role,
            isValid: validRoles.includes(admin_role),
            validRoles
        });

        if (!validRoles.includes(admin_role)) {
            return res.status(400).json({
                message: `Invalid admin role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        // Check super admin count if registering a new super_admin
        if (admin_role === 'super_admin') {
            const [superAdminResults] = await db.promise().query(
                'SELECT COUNT(*) as count FROM admins WHERE admin_role = "super_admin"'
            );
            const superAdminCount = superAdminResults[0].count;

            if (superAdminCount >= 3) {
                    return res.status(400).json({
                    message: 'Maximum number of super admins (3) has been reached'
                    });
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `
            INSERT INTO admins (
                username, 
                email, 
                phone_number, 
                password, 
                admin_role, 
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

            db.query(insertQuery, 
            [username, email, phone_number, hashedPassword, admin_role, req.admin.id],
                (err, result) => {
                    if (err) {
                    console.error('Admin creation error:', err);
                        return res.status(500).json({
                        message: 'Could not create admin account',
                        error: err.message
                    });
                }

                console.log('New admin profile created:', {
                    id: result.insertId,
                    username,
                    email,
                    admin_role,
                    created_by: req.admin.username
                });

                // Show admins table
                db.query('SELECT * FROM admins', (err, adminResults) => {
                    if (!err) {
                        console.table(adminResults);
                    }
                });

                    res.status(201).json({
                        message: 'Admin registered successfully',
                        admin: {
                            id: result.insertId,
                            username,
                            email,
                        admin_role,
                        created_by: req.admin.username
                        }
                    });
                }
            );
    } catch (error) {
        console.error('Server-side registration error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt received:', { email: req.body.email });

    const { email, password } = req.body;

        // Validate input
    if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Get admin from database
        const [admins] = await db.query(
            'SELECT id, email, password, admin_role FROM admins WHERE email = ?', 
            [email]
        );

        console.log('Database query result:', { found: admins.length > 0 });

        if (admins.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const admin = admins[0];

        // Compare password
        const validPassword = await bcrypt.compare(password, admin.password);
        console.log('Password validation:', { valid: validPassword });

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create token with all necessary admin data
        const token = jwt.sign(
            {
                id: admin.id, 
                email: admin.email,
                admin_role: admin.admin_role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
        });

        console.log('Login successful, token created and cookie set');

        // Send success response
        res.json({
            message: 'Login successful',
            admin: {
                id: admin.id,
                email: admin.email,
                admin_role: admin.admin_role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login', 
            error: error.message 
        });
    }
});

// Get admin profile (protected route)
router.get('/profile', authenticateAdmin, (req, res) => {
    console.log('Profile request for admin:', req.admin.username);
        res.json({
            admin: {
            username: req.admin.username,
            email: req.admin.email,
            admin_role: req.admin.admin_role
        }
    });
});

// Update admin profile (protected route)
router.put('/profile', authenticateAdmin, async (req, res) => {
    const adminId = req.admin.adminId;
    const { username, email, phone_number, current_password, new_password } = req.body;

    try {
        // First get the admin's current data
        const getAdminQuery = 'SELECT * FROM admins WHERE id = ?';
        db.query(getAdminQuery, [adminId], async (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({
                    message: 'Admin not found'
                });
            }

            const admin = results[0];

            // If changing password, verify current password
            if (new_password) {
                const validPassword = await bcrypt.compare(current_password, admin.password);
                if (!validPassword) {
                    return res.status(401).json({
                        message: 'Current password is incorrect'
                    });
                }
            }

            // Prepare update data
            const updates = {};
            if (username) updates.username = username;
            if (email) updates.email = email;
            if (phone_number) updates.phone_number = phone_number;
            if (new_password) {
                updates.password = await bcrypt.hash(new_password, 10);
            }

            // Update admin profile
            const updateQuery = 'UPDATE admins SET ? WHERE id = ?';
            db.query(updateQuery, [updates, adminId], (err, result) => {
                if (err) {
                    console.error('Update error:', err);
                    return res.status(500).json({
                        message: 'Could not update profile'
                    });
                }

                res.json({
                    message: 'Profile updated successfully',
                    updates: Object.keys(updates).filter(key => key !== 'password')
                });
            });
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            message: 'Profile update failed'
        });
    }
});

// Logout (optional - can be handled client-side by removing the token)
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
