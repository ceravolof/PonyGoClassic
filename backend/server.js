const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const hbs = require('hbs');
const mock = require('./DBMock.js'); // Mock database
const db = new mock(); // Replace with real DB logic in production
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'frontend')));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for the application',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local server' },
    ],
  },
  apis: [__filename], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get('/', (req, res) => {
  if (req.session.loggedin) {
    return res.redirect('/home');
  }
  console.log(req.session.loggedin);
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});


// Login page
app.get('/login', (req, res) => {
  if (req.session.loggedin) {
    return res.redirect('/home');
  }
  console.log(req.session.loggedin);
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Register user (admin only)
app.post('/register', (req, res) => {
  //if (!req.session.loggedin || req.session.role !== 'admin') {
  //  return res.status(403).send('Access denied');
  //}

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
    res.redirect('/');
  });
});

// Home page
app.get('/home', (req, res) => {
  if (!req.session.loggedin) {
    return res.redirect('../frontend/login.html');
  }

  if (req.session.role === 'admin') {
    res.render('admin/homea', {
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

// API endpoint to get all users (admin only)
app.get('/admin/users', (req, res) => {
  if (!req.session.loggedin || req.session.role !== 'admin') {
    return res.redirect('/');
  }

  // Ottieni la lista degli utenti dal database
  const users = db.getAllUsers(); // Assumi che getAllUsers() restituisca un array di utenti
  console.log(users)

  // Renderizza la pagina users.hbs e passa i dati degli utenti
  res.render('admin/users', { users });
});



// Start server
const port = 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));


/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Incorrect email or password
 */