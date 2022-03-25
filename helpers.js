// generates a random alphanumeric string.
const generateRandomString = () => {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

/**
 *  
 * @param {string} userId coming from the cookies
 * @param {object} userDb pulls from the users database
 * @returns user object
 */
const getUser = (userId, userDb) => {
  if (!userDb[userId]) return null;
  return userDb[userId];
};

/**
 * 
 * @param {string} email  coming from the body
 * @param {object} database pulls from the users database
 * @returns the id of the user after checking if the email entered matches the email in the users database
 */
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
};

/**
 * 
 * @param {string} id coming from the cookies
 * @param {object} database  pulls from users database
 * @returns the urls attached to the id of the user
 */
const urlsForUser = (id, database) => {
  let results = {};
  let keys = Object.keys(database);
  for (const key of keys) {
    if (database[key].userID === id) {
      results[key] = database[key].longURL;
    }
  }
  return results;
};



module.exports = {
  generateRandomString,
  getUser,
  getUserByEmail,
  urlsForUser,
}
