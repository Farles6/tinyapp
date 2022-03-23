const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

//Example of how data should look
const users = {};

let isLoggedIn = false

function generateRandomString() {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

/**
 * 
 * @param {string} userId coming from the cookies
 * @param {object} userDb user database
 * @returns user object
 */
const getUser = (userId, userDb) => {
  if (!userDb[userId]) return null;
  return userDb[userId];
};

const emailChecker = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const passwordChecker = (password) => {
  for (const user in users) {
    if (users[user].password === password) {
      return true;
    }
  }
  return false;
};

// temperary home page
app.get('/', (req, res) => {
  if (!isLoggedIn) {
    return res.redirect('/login');
  }
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: urlDatabase };
  res.render('urls_index', templateVars);
  return res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  // if (!isLoggedIn){
  //   return res.redirect('/login')
  // }

  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (!isLoggedIn) {
    return res.redirect('/login');
  }
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_register', templateVars);
});

app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars)
});


app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!isLoggedIn) {
    return res.redirect('/login');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});




app.post('/register', (req, res) => {
  const { email, password } = req.body
  if (!email) {
    return res.status(400).send('Need to enter an Email address.')
  };
  if (!password) {
    return res.status(400).send('Need to enter a password.')
  }
  if (emailChecker(email)) {
    return res.status(400).send('Email already exists');
  };

  const user = generateRandomString();
  users[user] = {
    id: user,
    email,
    password
  };
  res.cookie('user_id', user);
  isLoggedIn = true;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  let id = '';
  const { email, password } = req.body;
  if (!emailChecker(email)) {
    return res.status(403).send('Email not found.');
  }
  if (!passwordChecker(password)) {
    return res.status(403).send('Incorrect password.');
  }
  for (const user in users) {
    console.log(users[user]);
    id = users[user].id;
    res.cookie('user_id', users[user].id);
    isLoggedIn = true;
    return res.redirect('/urls');
  }

});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  isLoggedIn = false;
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});


app.get('/urls/:shortURL', (req, res) => {
  if (!isLoggedIn) {
    return res.redirect('/login');
  }
  const userId = req.cookies['user_id']
  const currentUser = getUser(userId, users)
  const templateVars = { user: currentUser, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});