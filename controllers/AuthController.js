// Handles the functionality for endpoints involving authentication.
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const sha1 = require('sha1');
const uuid = require('uuid');

class AuthController {
  /**
   * Sign-in the user by generating a new authentication token
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  async getConnect(req, res) {
    const basicAuth = req.headers.authorization;
    if (!basicAuth) return res.status(400).json({'error': 'Authorization header required'});

    const base64EncodedStr = basicAuth.split('Basic ', 2)[1];
    if (!base64EncodedStr) return res.status(400).json({'error': 'invalid basic auth syntax'});
    

    const decodedStr = Buffer.from(base64EncodedStr, 'base64').toString('utf-8');
    if (!decodedStr) return res.status(400).json({'error': 'invalid base64'});
    

    const credentials = decodedStr.split(':', 2);
    if (!credentials) return res.status(400).json({'error': 'Unexpected credentials format'});
    

    const email = credentials[0];
    const password = credentials[1];
    
    // find existing user
    const sha1Password = sha1(password);
    const user = await dbClient.findOneUser({email, 'password': sha1Password});
    if (!user) return res.status(401).json({'error': 'Unauthorized'});

    const token = uuid.v4();
    const key = `auth_${token}`;
    const userId = user._id.toString();

    try {
      await redisClient.set(key, userId, 24 * 60 * 60 * 1);
      console.log('from getConnect:', await redisClient.get(key));
    } catch (error) {
      return res.status(500).json({'error': 'Server-side error'});
    }

    res.status(200).json({ token });
  }

  /**
   * Sign-out the user based on the given authentication token.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({'error': 'Unauthorized'});

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({'error': 'Unauthorized'});

    await redisClient.del(`auth_${token}`);
    res.status(204).end();
  }
}

const authController = new AuthController();

module.exports = authController;
