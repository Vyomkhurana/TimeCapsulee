const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from "public"

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Serve login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Html/login.html'));
});

// Serve signup.html (Fixing the issue)
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Html/signup.html'));
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.sendFile(path.join(__dirname, 'public/Html/error.html'));
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
