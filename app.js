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

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');


const app = express();

// Enable CORS for all routes
app.use(cors());
app.options('*', cors());

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.use('/users', usersRouter);
app.use('/api/capsules', capsuleRouter);

// Serve Static HTML Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'index.html'));
});

// Redirect /index to root
app.get('/index', (req, res) => {
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'signup.html'));
});

app.get('/features', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'features.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'dashboard.html'));
});

app.get('/how-it-works', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'how-it-works.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'pricing.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'contact.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'about.html'));
});

app.get('/mission', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'mission.html'));
});

app.get('/team', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'team.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'terms.html'));
});

app.get('/cookies', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'cookies.html'));
});

// API routes
app.use('/', indexRouter);

// Handle 404 Errors
app.use((req, res, next) => {
  next(createError(404, 'Page not found'));
});



// Error Handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);

  const errorPagePath = path.join(__dirname, 'public', 'Html', 'error.html');
  if (fs.existsSync(errorPagePath)) {
    res.sendFile(errorPagePath);
  } else {
    res.json({
      message: err.message,
      error: req.app.get('env') === 'development' ? err : {}
    });
  }
});

startScheduler();

// Start Server
const PORT = process.env.PORT || 4000; // Changed to 3000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;