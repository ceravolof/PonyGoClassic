const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const hbs = require('hbs');
const mock = require('./DBMock.js'); // Mock database
const db = new mock(); // Replace with real DB logic in production

const app = express();

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Secure: true in production with HTTPS
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'hbs');
app.use('/static', express.static(path.join(__dirname, 'public')));

// Routes

// Login page
app.get('/login', (req, res) => {
  if (req.session.loggedin) {
    return res.redirect('/home');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register user (admin only)
app.post('/register', (req, res) => {
  if (!req.session.loggedin || req.session.role !== 'admin') {
    return res.status(403).send('Access denied');
  }

  const { email, username, password, type } = req.body;
  if (!email || !username || !password || !type) {
    return res.render('error', { message: 'All fields are required!' });
  }

  const user = db.createUser({ email, username, password, type });
  req.session.message = `User (ID: ${user.id}) created successfully.`;
  res.redirect('/home');
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('error', { message: 'Email and password are required!' });
  }

  const user = db.getUserByEmail(email);
  if (user && user.password === password) {
    req.session.loggedin = true;
    req.session.name = user.username;
    req.session.role = user.type;
    res.redirect('/home');
  } else {
    res.render('error', { message: 'Incorrect email or password!' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout.');
    }
    res.redirect('/login');
  });
});

// Home page
app.get('/home', (req, res) => {
  if (!req.session.loggedin) {
    return res.redirect('/login');
  }

  if (req.session.role === 'admin') {
    res.render('admin/home', {
      name: req.session.name,
      role: req.session.role,
      message: req.session.message || ''
    });
  } else {
    res.render('home', {
      name: req.session.name,
      role: req.session.role,
      message: `Welcome back, ${req.session.name}!`
    });
  }
});

// Start server
const port = 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));

