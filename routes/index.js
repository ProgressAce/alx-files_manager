// Sets up all the endpoints for the api.

const express = require('express');
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UsersController');

const router = express.Router();
router.use(express.json());

router.get('/status', (req, res) => {
  AppController.getStatus(res);
});

router.get('/stats', (req, res) => {
  AppController.getStats(res);
});

router.post('/users', (req, res) => {
  UserController.postNew(req, res);
});

module.exports = router;
