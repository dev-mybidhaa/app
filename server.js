// Main backend entry point 
require('dotenv').config({ path: './config/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const db = require('./config/db');
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');

// Verify JWT_SECRET is loaded
console.log('JWT_SECRET status:', process.env.JWT_SECRET ? 'Loaded' : 'Not loaded');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'https://www.mybidhaa.com',
    'https://mybidhaa.com'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/adminAuth');
const booksRoutes = require('./routes/books');
const apparatusRoutes = require('./routes/apparatus');
const stationeriesRoutes = require('./routes/stationeries');
const searchRoutes = require('./routes/search');
const playgroundRoutes = require('./routes/playground');
const electronicsRoutes = require('./routes/electronics');

// Use routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/books', booksRoutes);
app.use('/apparatus', apparatusRoutes);
app.use('/stationeries', stationeriesRoutes);
app.use('/api/search', searchRoutes);
app.use('/playground', playgroundRoutes);
app.use('/api/electronics', electronicsRoutes);

// Redirect root to login page
app.get('/', (req, res) => {
    res.redirect('./public/index.html');
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
