// MySQL connection (Sequilize or mysql2)
const mysql = require('mysql2');
require('dotenv').config({ path: './.env' }); // Load environment variables

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'bidhaa_db',
    multipleStatements: true // Enable multiple SQL statements
};

const db = mysql.createConnection(dbConfig);

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ', err);
    } else {
        console.log(`Connected to MySQL database: ${dbConfig.database}`);
        
        // Verify users table
        db.query('SHOW TABLES', (err, tables) => {
            if (err) {
                console.error('Error checking tables:', err);
            } else {
                console.log('Available tables:', tables);
                
                // Check users table structure
                db.query('DESCRIBE users', (err, structure) => {
                    if (err) {
                        console.error('Error checking users table structure:', err);
                    } else {
                        console.log('Users table structure:', structure);
                    }
                });
                
                // Show sample of existing users
                db.query('SELECT * FROM users LIMIT 5', (err, users) => {
                    if (err) {
                        console.error('Error checking existing users:', err);
                    } else {
                        console.log('Sample users:', users);
                    }
                });
            }
        });

        // Query to show all admins
        db.query('SELECT * FROM admins', (err, adminResults) => {
            if (err) {
                console.error('Error fetching admins:', err);
            } else {
                console.log('\nAdmins table contents:');
                console.table(adminResults);
            }
        });

        // Show table structures
        db.query('DESCRIBE users', (err, userStructure) => {
            if (err) {
                console.error('Error fetching users table structure:', err);
            } else {
                console.log('\nUsers table structure:');
                console.table(userStructure);
            }
        });

        db.query('DESCRIBE admins', (err, adminStructure) => {
            if (err) {
                console.error('Error fetching admins table structure:', err);
            } else {
                console.log('\nAdmins table structure:');
                console.table(adminStructure);
            }
        });
    }
});

// Export promise-based connection for async/await usage
const promiseDb = db.promise();

// Admin database configuration


// Vendor database configuration


module.exports = { db, promiseDb };

// Add error event handler to catch connection issues
db.on('error', (err) => {
    console.error('MySQL connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused. Make sure MySQL is running and credentials are correct.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Access denied - check username and password.');
    }
});

// Add connect event handler
db.on('connect', () => {
    console.log('Successfully connected to MySQL database');
});

// Test the connection explicitly
db.query('SELECT 1', (err) => {
    if (err) {
        console.error('Error testing database connection:', err);
    } else {
        console.log('Database connection test successful');
    }
});
