// ======================
// Server Configuration
// ======================
const path = require('path');
require('dotenv').config(); // Load environment variables from root .env

const express = require('express');
const app = express();
const db = require('./config/db');
const port = process.env.PORT || 3000; // Flexible port for cPanel
const cookieParser = require('cookie-parser');
const cors = require('cors');

// ======================
// Environment Verification
// ======================
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'Missing');
console.log('DB Connection:', process.env.DB_NAME ? 'Configured' : 'Check .env');

// ======================
// Middleware
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Static files

// CORS Configuration (Production + Development)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mybidhaa.com', 'https://www.mybidhaa.com']
    : ['http://localhost:3000', `http://localhost:${port}`],
  credentials: true
};
app.use(cors(corsOptions));

// ======================
// Route Imports
// ======================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/adminAuth');
const booksRoutes = require('./routes/books');
const apparatusRoutes = require('./routes/apparatus');
const stationeriesRoutes = require('./routes/stationeries');
const searchRoutes = require('./routes/search');
const playgroundRoutes = require('./routes/playground');
const electronicsRoutes = require('./routes/electronics');

// ======================
// Route Middlewares
// ======================
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/books', booksRoutes);
app.use('/apparatus', apparatusRoutes);
app.use('/stationeries', stationeriesRoutes);
app.use('/api/search', searchRoutes);
app.use('/playground', playgroundRoutes);
app.use('/electronics', electronicsRoutes);

// ======================
// cPanel Validation Endpoint (NEW)
// ======================
app.get('/cpanel-validator', (req, res) => {
  res.status(200).json({ 
    status: 'running',
    app: 'MyBidhaa',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ======================
// Special Routes
// ======================
// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Root Route - Serve Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// ======================
// Server Initialization
// ======================
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Access URLs:
  - Local: http://localhost:${port}
  - Production: https://mybidhaa.com`);
  console.log(`API Endpoints:
  - Auth: /auth
  - Books: /books
  - Search: /api/search`);
  console.log(`Validation endpoint: /cpanel-validator`);
});