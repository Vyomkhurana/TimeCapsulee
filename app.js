require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const db = require('./db'); 
const cors = require('cors');
const capsuleRouter = require('./routes/capsules');
const { startScheduler } = require('./services/scheduler');
const usersRouter = require('./routes/users');
const { rateLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/validation');
const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
    req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.startTime = Date.now();
    res.setHeader('X-Request-ID', req.id);
    next();
});

app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
        res.responseTime = Date.now() - req.startTime;
        if (res.responseTime > 1000) {
            console.warn(`[Performance] Slow request: ${req.method} ${req.path} - ${res.responseTime}ms`);
        }
        return originalSend.call(this, data);
    };
    next();
});

app.use(rateLimiter({
    max: process.env.RATE_LIMIT_MAX || 100,
    windowMs: 15 * 60 * 1000,
    message: { success: false, error: 'Too many requests, please try again later.' }
}));

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Powered-By', 'TimeCapsule');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:;");
    next();
});
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, error: 'Invalid JSON payload' });
      throw new Error('Invalid JSON');
    }
  }
})); 
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else if (filePath.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
}));
app.use('/users', usersRouter);
app.use('/api/capsules', capsuleRouter);
app.get('/health', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const dbHealth = await db.healthCheck();
    const dbStats = db.getConnectionStats();
    
    const health = {
      status: dbHealth.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
      },
      database: {
        status: dbHealth.healthy ? 'connected' : 'disconnected',
        ...dbStats
      },
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        percentUsed: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      },
      version: '3.2.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    const statusCode = dbHealth.healthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api', (req, res) => {
  res.json({
    name: 'Time Capsule API',
    version: '3.2.0',
    apiVersion: 'v1',
    description: 'Digital time capsule application with advanced features',
    documentation: '/api/docs',
    endpoints: {
      capsules: '/api/capsules',
      users: '/users',
      health: '/health',
      templates: '/api/templates',
      analytics: '/api/analytics'
    },
    features: [
      'Advanced search & filtering',
      'Capsule sharing & collaboration',
      'Tags & categories',
      'Archive & star favorites',
      'Bulk operations',
      'Smart reminders',
      'Analytics & insights',
      'Rate limiting & security',
      'Input validation & sanitization',
      'File uploads with compression',
      'Email notifications with queue',
      'Template system',
      'Two-factor authentication',
      'Account tiers & storage limits'
    ],
    status: 'active',
    uptime: Math.floor(process.uptime()),
    lastUpdated: '2026-01-13'
  });
});
const htmlPages = [
  'index', 'login', 'forgot-password', 'reset-password', 'signup',
  'features', 'dashboard', 'my-capsules', 'schedule', 'analytics',
  'messages', 'groups', 'settings', 'capsules-view', 'how-it-works',
  'pricing', 'contact', 'about', 'mission', 'team', 'privacy', 'terms', 'cookies'
];
const serveHtmlPage = (page) => (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'Html', `${page}.html`);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return next(createError(404, `Page ${page} not found`));
    }
    res.sendFile(filePath);
  });
};
htmlPages.forEach(page => {
  const route = page === 'index' ? '/' : `/${page}`;
  app.get(route, serveHtmlPage(page));
});
app.use((req, res, next) => {
  next(createError(404, 'Page not found'));
});
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.error('Error occurred:', {
    errorId,
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    stack: isDev ? err.stack : undefined
  });

  res.status(err.status || 500);
  
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.json({
      success: false,
      message: err.message || 'An error occurred',
      errorId,
      ...(isDev && { stack: err.stack, details: err })
    });
  }

  const errorPagePath = path.join(__dirname, 'public', 'Html', 'error.html');
  if (fs.existsSync(errorPagePath)) {
    res.sendFile(errorPagePath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error ${err.status || 500}</title>
          <style>
            body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
            .error-container{text-align:center;max-width:600px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
            h1{font-size:4rem;margin:0 0 20px}
            p{font-size:1.2rem;opacity:0.9}
            .error-id{font-size:0.85rem;opacity:0.7;margin-top:20px}
            a{color:#fff;text-decoration:none;padding:12px 24px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-block;margin-top:20px;transition:all 0.3s}
            a:hover{background:rgba(255,255,255,0.3);transform:translateY(-2px)}
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>${err.status || 500}</h1>
            <p>${err.message || 'Something went wrong'}</p>
            ${isDev ? `<pre style="text-align:left;background:rgba(0,0,0,0.3);padding:15px;border-radius:8px;overflow:auto;max-height:300px;font-size:0.8rem">${err.stack}</pre>` : ''}
            <div class="error-id">Error ID: ${errorId}</div>
            <a href="/">Return to Home</a>
          </div>
        </body>
      </html>
    `);
  }
});

const logger = require('./utils/logger');
const { ensureIndexes } = require('./utils/dbOptimizer');

logger.info('🚀 Starting TimeCapsule API server...');
console.log('🚀 Starting scheduler...');
startScheduler();

if (db.isConnected()) {
    logger.info('✅ MongoDB connected - initializing indexes...');
    ensureIndexes().then(result => {
        if (result.success) {
            logger.info('✅ Database indexes initialized');
        } else {
            logger.warn('⚠️ Index initialization failed', { error: result.error });
        }
    });
} else {
    logger.warn('⚠️ MongoDB not connected yet - indexes will be created on connection');
}

try {
  const connected = typeof db.isConnected === 'function' ? db.isConnected() : false;
  console.log(`MongoDB connected: ${connected}`);
} catch (e) {
  console.warn('Could not determine MongoDB connection state', e && e.message ? e.message : e);
}
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
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
module.exports = app;