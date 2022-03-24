const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const read = require('body-parser/lib/read');
const bcrypt = require('bcryptjs');

app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');



const urlDatabase = {
  'b2xVn2': { 
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'ah5jt'
  },
  '9sm5xK': { 
    longURL: 'http://www.google.com',
    userID: 'qrn5k',
  }
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
  for (const userid in users) {
    const user = users[userid]
    if (user.email === email) {
    return user;
    }
  }
  return null;
};

// const passwordChecker = (password) => {
//   for (const user in users) {
//     if (users[user].password === password) {
//       return true;
//     }
//   }
//   return false;
// };

const urlsForUser = (id) => {
  let urls = {};
  let keys = Object.keys(urlDatabase);
  for (const key of keys){
    if (urlDatabase[key].userID === id){
      urls[key] = urlDatabase[key].longURL
    }
  }
return urls;
}

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

app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars)
});

app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser };
  res.render('urls_register', templateVars);
});

app.get('/urls', (req, res) => {
  
  const userId = req.cookies['user_id'];
  const userURLs = urlsForUser(userId);
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: userURLs };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (!isLoggedIn) {
    return res.send('Please log in to create URLs');
  }
  const userId = req.cookies['user_id'];
  const currentUser = getUser(userId, users);
  const templateVars = { user: currentUser, urls: urlDatabase };
  res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url){
    return res.status(404).send('Page not found.')
  }
  return res.redirect(url.longURL);
  });



app.get('/urls/:shortURL', (req, res) => {
  if (!isLoggedIn) {
    return res.redirect('/login');
  }
  const userId = req.cookies['user_id']
  const currentUser = getUser(userId, users)
  const templateVars = { user: currentUser, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render('urls_show', templateVars);
});


//////post routes/////////

app.post('/login', (req, res) => {
  let id = '';
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be blank.');
  }
  const user = emailChecker(email)
  if (!user){
    return res.status(403).send('No user found');
  }  
console.log(user.password)
if (!bcrypt.compareSync(password, user.password)){
  return res.status(400).send('Passwords do not match.')
}
res.cookie('user_id', user.id);
  isLoggedIn = true;
  return res.redirect('/urls');

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

const hashedPassword = bcrypt.hashSync(password, 10)
const user = generateRandomString();

  users[user] = {
    id: user,
    email,
    password: hashedPassword,
  };
  console.log(users)
  res.cookie('user_id', user);
  isLoggedIn = true;
  res.redirect('/urls');

});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  isLoggedIn = false;
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  if (!isLoggedIn){
    res.status(403).send('please sign in first');
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies['user_id'],
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
 if (Object.keys(urlsForUser(req.cookies['user_id'])).includes(req.params.shortURL)){
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
 }
 read.status(403).send('You don\'t have permission to delete URLs.')
});

app.post('/urls/:shortURL', (req, res) => {
  if (Object.keys(urlsForUser(req.cookies['user_id'])).includes(req.params.shortURL)){
    res.redirect(`/urls/${req.params.shortURL}`);
   }
   read.status(403).send('You don\'t have permission to edit URLs.')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


