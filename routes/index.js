// Set up all the endpoints for the api.

const express = require('express');
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

const router = express.Router();
router.use(express.json()); // process json parameters

// let controllers handle functionality

// gives status of the database(db) and redis client connections
router.get('/status', (req, res) => {
  AppController.getStatus(res);
});

// gives the total number of user and file documents from the db
router.get('/stats', (req, res) => {
  AppController.getStats(res);
});

// create and insert a new user into db
router.post('/users', (req, res) => {
  UserController.postNew(req, res);
});

// create new authentication(auth) token for a user (sign-in)
// token connection to api lasts 24hrs
router.get('/connect', (req, res) => {
  AuthController.getConnect(req, res);
});

// delete a user's auth token (sign-out)
router.get('/disconnect', (req, res) => {
  AuthController.getDisconnect(req, res);
});

// retrieve a user's details using their auth token
router.get('/users/me', (req, res) => {
  UserController.getMe(req, res);
});

module.exports = router;
