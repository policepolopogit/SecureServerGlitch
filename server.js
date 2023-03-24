const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

// User data
const users = [
  { id: 1, username: 'EltonJohn69', password: 'Saad2010' },
  { id: 2, username: 'policepolopo', password: 'Farisda1234' }
];

// Set up static files
app.use(express.static(path.join(__dirname)));

// Parse JSON and URL-encoded query string data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add cookie parser middleware
app.use(cookieParser());

// Set up sessions
const sessionMiddleware = session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: true
});
app.use(sessionMiddleware);

// Set up routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user with matching username
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).send('Invalid username or password');
  }

  // Check password
  if (password !== user.password) {
    return res.status(401).send('Invalid username or password');
  }

  // Store user in session
  req.session.user = user;

  // Set the socket.io username
  req.io_username = user.username;

  // Redirect to chat page
  res.redirect('/chat');
});

app.get('/chat', (req, res) => {
  // Check if user is authorized
  if (!req.session || !req.session.user) {
    return res.redirect('/');
  }

  res.sendFile(path.join(__dirname, 'chat.html'));
});

// Socket.io
io.use((socket, next) => {
  // Use the session middleware to parse the cookie and retrieve the session data
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', socket => {
  console.log('A user has connected');

  // Listen for chat messages
  socket.on('chat message', message => {
    // Get the username from the user's session
    const username = socket.request.session.user ? socket.request.session.user.username : 'anonymous';

    // Construct the formatted message string
    const formattedMessage = `${username} | ${message}`;

    console.log(`Message received: ${formattedMessage}`);
    io.emit('chat message', formattedMessage);
  });

  socket.on('disconnect', () => {
    console.log('A user has disconnected');
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

