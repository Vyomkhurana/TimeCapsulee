const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const mongoose = require('./db'); // MongoDB connection
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// Enable CORS for all routes
app.use(cors());
app.options('*', cors()); // Handle preflight requests

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from "public"

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Serve Static HTML Pages (Ensure the path is correct)
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'home.html'));
});


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Html', 'signup.html'));
});

// Handle 404 Errors
app.use((req, res, next) => {
  next(createError(404, 'Page not found'));
});

// Error Handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);

  // Check if error.html exists before serving
  const errorPagePath = path.join(__dirname, 'public', 'Html', 'error.html');
  if (fs.existsSync(errorPagePath)) {
    res.sendFile(errorPagePath);
  } else {
    res.json({ message: err.message, error: req.app.get('env') === 'development' ? err : {} });
  }
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
