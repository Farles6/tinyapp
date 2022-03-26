const { generateRandomString, getUser, getUserByEmail, urlsForUser } = require('./helpers');
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { urlDatabase, users } = require('./database');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


//////////// get routes /////////

// home page redirects to the login page
app.get('/', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect('/login');
  }
  return res.redirect('/urls');
});

// login page with email and password forms
app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars)
});

// register page with email and password forms
app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_register', templateVars);
});

// displays content of urlDatabase
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

// page for creating new short urls
app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.redirect('/login')
  }
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: urlDatabase };
  res.render('urls_new', templateVars);
});

// redirects to the long urls web page
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
  const urlEdit = urlDatabase[req.params.id];
  if (urlEdit.userID !== userId) {
    return res.status(400).send('You do not have permission to do that.');
  }
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render('urls_show', templateVars);
});


//////post routes/////////

// allows you to login by entering email/password and hitting submit (if credentials match the cookies)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Invalid credentials please <a href="/login">try again</a>.');
  }
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(400).send('No user found. Please <a href="/login">try again</a>.');
  }
  if (!bcrypt.compareSync(password, users[user].password)) {
    return res.status(400).send('Invalid credentials. Please <a href="/login">try again</a>.');
  }
  req.session.user_id = users[user].id;
  return res.redirect('/urls');

});

//allow you to register for an account by entering email/password and hitting submit
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

//logs you out of account and clears cookies from webpage
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

// deletes urls from the urls page
app.post('/urls/:id/delete', (req, res) => {
  if (!Object.keys(urlsForUser(req.session.user_id, urlDatabase)).includes(req.params.id)) {
    return res.status(403).send('You don\'t have permission to delete URLs.');
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  if (!Object.keys(urlsForUser(req.session.user_id, urlDatabase)).includes(req.params.id)) {
    return res.status(403).send('You don\'t have permission to go here.');
  }
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  return res.redirect('/urls');
});
// listening on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


