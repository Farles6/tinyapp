const { generateRandomString, getUser, getUserByEmail, urlsForUser } = require('./helpers');
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


const urlDatabase = {};

const users = {};



app.get('/', (req, res) => {
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars)
});

app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_register', templateVars);
});

app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.status(400).send('Please <a href="/login">Login</a> ');
  }
  const userURLs = urlsForUser(userId, urlDatabase);
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: userURLs };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.redirect('/login')
  }
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: urlDatabase };
  res.render('urls_new', templateVars);
});

app.get('/u/:id', (req, res) => {
  const url = urlDatabase[req.params.id];
  const userId = req.session.user_id;
  if (!url) {
    return res.status(404).send('Page not found.');
  }

  return res.redirect(url.longURL);
});

app.get('/urls/:id', (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.status(400).send('Please <a href="/login">Login</a> ');
  }
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render('urls_show', templateVars);
});


//////post routes/////////

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Invalid credentials please <a href="/login">try again</a>.');
  }
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(400).send('No user found. Please <a href="/login">try again</a>.');
  }
  for (const userID in users) {
    if (!bcrypt.compareSync(password, users[userID].password)) {
      return res.status(400).send('Invalid credentials. Please <a href="/login">try again</a>.');
    }
    req.session.user_id = users[userID].id;
    return res.redirect('/urls');
  }
});


app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).send('Need to enter an <a href="/register">Email address</a>.');
  };
  if (!password) {
    return res.status(400).send('Need to enter a <a href="/register">password</a>.');
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send('Email already exists. Please <a href="/register">try again</a>.');
  };

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = generateRandomString();

  users[user] = {
    id: user,
    email,
    password: hashedPassword,
  };
  req.session.user_id = user;
  res.redirect('/urls');

});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(400).send('Please <a href="/login">Login</a> ');
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  if (!Object.keys(urlsForUser(req.session.user_id, urlDatabase)).includes(req.params.id)) {
    return res.status(403).send('You don\'t have permission to delete URLs.');
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  return res.redirect(`/urls/${req.params.id}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


