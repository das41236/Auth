const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

const User = require('./user.js');

const STATUS_USER_ERROR = 422;
const BCRYPT_COST = 11;

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());
server.use(session({
  secret: 'e5SPiqsEtjexkTj3Xqovsjzq8ovjfgVDFMfUzSmJO21dtXs4re',
  resave: true,
  saveUninitialized: true
}));

/* Sends the given err, a string or an object, to the client. Sets the status
 * code appropriately. */
const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  if (err && err.message) {
    res.json({ message: err.message, stack: err.stack });
  } else {
    res.json({ error: err });
  }
};

const hashPw = (req, res, next) => {
  const { password } = req.body;
  console.log(password);
  if (!password || password.length === 0) {
    sendUserError('Please provide a password.', res);
  } else {
    bcrypt.hash(password, BCRYPT_COST, (err, hashedPw) => {
      if (err) {
        sendUserError(err, res);
      } else {
        req.body.pwHash = hashedPw;
      }
      next();
    });
  }
};

// TODO: implement routes

server.get('/', (req, res) => {
  res.json({ message: 'API running...' });
});

server.post('/users', hashPw, (req, res) => {
  const { username, pwHash } = req.body;
  // const { hashedPw } = req;
  // console.log(req.body);
  const user = new User({ username, passwordHash: pwHash });
  user.save((err, savedUser) => {
    console.log(err, savedUser);
    if (err || !savedUser) {
      sendUserError('No user was saved', res);
    } else {
      req.session.username = savedUser.username;
      res.json(savedUser)
      .catch(err => sendUserError(err, res));
    }
  });
});

server.post('/log-in', (req, res) => {
  const username = req.body.username;
  const password = req.body.pwHash;
  if (!username || !password) {
    sendUserError('Username and password required', res);
  } else {
    username = username.toLowerCase();
    User.findOne({ username }).then((user) => {
      user.checkPassword(password, function (err, valid) {
        if (!valid) {
          return sendUserError('Invalid username or password', res);
        }
        req.session.username = username;
        req.session.isAuth = true;
        res.json({ success: validate });
      });
    })
    .catch(err => sendUserError('User does not exist in the system', res));
  }
});

// TODO: add local middleware to this route to ensure the user is logged in
server.get('/me',sendUserError, (req, res) => {
  // Do NOT modify this route handler in any way.
  res.json(req.user);
  
});

module.exports = { server };
