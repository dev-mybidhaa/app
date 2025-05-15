// MySQL connection using mysql2
const mysql = require('mysql2');
require('dotenv').config({ path: './.env' });

// Database configuration with fallback to your provided credentials
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'mybidhaa_knjoroge',
    password: process.env.DB_PASSWORD || 'Godbless@2025',
    database: process.env.DB_NAME || 'mybidhaa_db',
    multipleStatements: true, // Keep your multiple statements setting
    waitForConnections: true,
    connectionLimit: 10, // Added connection pooling
    queueLimit: 0,
    timezone: '+00:00' // UTC timezone
};

// Create connection pool instead of single connection
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Function to verify database structure (your existing verification logic)
async function verifyDatabaseStructure() {
    let connection;
    try {
        connection = await promisePool.getConnection();
        
        console.log(`Connected to MySQL database: ${dbConfig.database}`);
        
        // Verify tables exist
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Available tables:', tables);
        
        // Check users table structure if exists
        if (tables.some(table => table.Tables_in_mybidhaa_db === 'users')) {
            const [userStructure] = await connection.query('DESCRIBE users');
            console.log('Users table structure:', userStructure);
            
            // Show sample of existing users
            const [users] = await connection.query('SELECT * FROM users LIMIT 5');
            console.log('Sample users:', users);
        }
        
        // Check admins table if exists
        if (tables.some(table => table.Tables_in_mybidhaa_db === 'admins')) {
            const [adminResults] = await connection.query('SELECT * FROM admins');
            console.log('\nAdmins table contents:');
            console.table(adminResults);
            
            const [adminStructure] = await connection.query('DESCRIBE admins');
            console.log('\nAdmins table structure:');
            console.table(adminStructure);
        }
        
        // Test connection
        await connection.query('SELECT 1');
        console.log('Database connection test successful');
    } catch (err) {
        console.error('Database verification error:', err);
    } finally {
        if (connection) connection.release();
    }
}

// Run verification on startup
verifyDatabaseStructure();

// Event handlers
pool.on('connection', (connection) => {
    console.log('New MySQL connection established');
});

pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
    } else if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused. Make sure MySQL is running and credentials are correct.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Access denied - check username and password.');
    }
});

// Export both callback and promise interfaces
module.exports = {
    // Original callback-style interface
    db: pool,
    
    // Promise-based interface
    promiseDb: promisePool,
    
    // Helper method for getting a connection
    getConnection: () => promisePool.getConnection(),
    
    // Helper method for transactions
    async executeTransaction(callback) {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
};