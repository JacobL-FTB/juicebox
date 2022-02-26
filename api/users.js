const express = require('express');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUser } = require('../db');
const jwt = require('jsonwebtoken');

usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users');
  next();
});

//Gets all the users, then sends them to the front end.
usersRouter.get('/', async (reg, res) => {
  const users = await getAllUsers();
  res.send({
    users,
  });
});

//If the /login route is connected to, attempt to login with credentials.
usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  // login request must have both
  if (!username || !password) {
    next({
      name: 'MissingCredentialsError',
      message: 'Please supply both a username and password',
    });
  }


  //If The username and password are equal to the users username and password in the database, log them in.
  try {
    const user = await getUserByUsername(username);

    if (user && user.password == password) {
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET
      );
      res.send({ message: "you're logged in!", token: token });
    } else {
      next({
        name: 'IncorrectCredentialsError',
        message: 'Username or password is incorrect',
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});


//Registers a user by adding their info into the database.
usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body;

  //If a user with the same username already exists in the database, this throws an error.
  try {
    const _user = await getUserByUsername(username);
    if (_user) {
      next({
        name: 'UserExists',
        message: 'A user with that username already exists.',
      });
      //Creates a user with the listed info.
    }
    const user = await createUser({
      username,
      password,
      name,
      location,
    });
    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1w',
      }
    );
    res.send({
      message: 'Thank you for signing up!',
      token,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = usersRouter;
