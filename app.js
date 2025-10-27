require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const mongoose = require('./db'); // MongoDB connection
const cors = require('cors');
const capsuleRouter = require('./routes/capsules');
const { startScheduler } = require('./services/scheduler');
const usersRouter = require('./routes/users');
const { rateLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/validation');

const app = express();

// Trust proxy (useful if behind a reverse proxy like nginx)
app.set('trust proxy', 1);

// Global rate limiter for all routes
app.use(rateLimiter({ 
    max: 1000, 
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again later.'
}));

// Enable CORS for all routes
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Enhanced Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Powered-By', 'TimeCapsule'); // Hide Express
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Middleware
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization middleware
app.use(sanitizeInput);

// Static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// API Routes
app.use('/users', usersRouter);
app.use('/api/capsules', capsuleRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Time Capsule API',
    version: '2.0.0',
    description: 'Digital time capsule application with advanced features',
    endpoints: {
      capsules: '/api/capsules',
      users: '/users',
      health: '/health'
    },
    features: [
      'Advanced search & filtering',
      'Capsule sharing',
      'Tags & categories',
      'Archive & star',
      'Bulk operations',
      'Reminders',
      'Analytics & reports',
      'Rate limiting',
      'Input validation'
    ]
  });
});

// Serve Static HTML Pages - Optimized with a helper function
const htmlPages = [
  'index', 'login', 'forgot-password', 'reset-password', 'signup',
  'features', 'dashboard', 'my-capsules', 'schedule', 'analytics',
  'messages', 'groups', 'settings', 'capsules-view', 'how-it-works',
  'pricing', 'contact', 'about', 'mission', 'team', 'privacy', 'terms', 'cookies'
];

// Dynamic route handler for HTML pages
const serveHtmlPage = (page) => (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'Html', `${page}.html`);
  // Check if file exists to prevent errors
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return next(createError(404, `Page ${page} not found`));
    }
    res.sendFile(filePath);
  });
};

// Register all HTML page routes dynamically
htmlPages.forEach(page => {
  const route = page === 'index' ? '/' : `/${page}`;
  app.get(route, serveHtmlPage(page));
});

// Handle 404 Errors
app.use((req, res, next) => {
  next(createError(404, 'Page not found'));
});

// Error Handler with better logging
app.use((err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Set locals for error page
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  res.status(err.status || 500);

  // Send appropriate response based on request type
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    // API request - send JSON
    res.json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    // Browser request - send HTML
    const errorPagePath = path.join(__dirname, 'public', 'Html', 'error.html');
    if (fs.existsSync(errorPagePath)) {
      res.sendFile(errorPagePath);
    } else {
      res.send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>${err.status || 500} Error</h1>
            <p>${err.message}</p>
            ${process.env.NODE_ENV === 'development' ? `<pre>${err.stack}</pre>` : ''}
          </body>
        </html>
      `);
    }
  }
});

// Start the scheduler
console.log('🚀 Starting scheduler...');
startScheduler();

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🕰️  Time Capsule Server Started    ║
║                                       ║
║   Port: ${PORT.toString().padEnd(28)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}║
║   Time: ${new Date().toLocaleTimeString().padEnd(28)}║
╚═══════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;