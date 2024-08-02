// Handles the definitions for user endpoints.
const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  /**
   * Creates a new user in the database.
   * 
   * The user email and password are required, otherwise a 400 status
   * code is returned.
   * The password is hashed with sha1.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON} status code 201, along with the new user's email and id
   * otherwise status code 400 if something went wrong.
   */
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({'error': 'Missing email'});
    if (!password) return res.status(400).json({'error': 'Missing password'});

    const user = await dbClient.findOneUser({email});
    if (user) return res.status(400).json({'error': 'Already exist'});

    const hashedPwd = sha1(password);
    if (!hashedPwd) return res.status(500).json({'error': 'Server-side error occured'});

    const result = await dbClient.insertOneUser(email, password);
    if (!result.result.ok) return res.status(500).json({'error': 'Server-side error occured'});

    res.status(201).json({ 'id': result.insertedId, email });
  }
}

const usersController = new UsersController();

module.exports = usersController;