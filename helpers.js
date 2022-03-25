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
 * @param {object} userDb user database
 * @returns user object
 */
const getUser = (userId, userDb) => {
  if (!userDb[userId]) return null;
  return userDb[userId];
};

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
};

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
