// contains the definitions for the endpoints requiring authentication.

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const uuid = require('uuid');
const sha1 = require('sha1');

module.exports = {
  /**
   * Sign-in the user by generating a new authentication token, from the request.
   * (The token is inserted as a key into Redis with the user's ID as the value).
   * Sends json responses with suitable status codes to the
   * client / user-agent.
   * @param {Request} req a http request from express route
   * @param {Response} res a http response from express route
   * @returns
   */
  getConnect: (req, res) => {
    const authValue = req.headers.authorization || '';

    if (!authValue.startsWith('Basic ')) {
      res.status(400).json({ error: "The given authorization header does not start with 'Basic '." });
      return;
    }

    const base64String = authValue.split('Basic ')[1];
    // convert to binary and then to utf-8
    const decodedBuffer = Buffer.from(base64String, 'base64').toString('utf-8');

    const userCredentials = decodedBuffer.split(':', 2);
    const email = userCredentials[0];
    const pwd = userCredentials[1];

    const sha1Pwd = sha1(pwd, 'utf-8');

    (async () => {
      await dbClient.users.findOne({ email, password: sha1Pwd }, async (err, user) => {
        if (err) {
          res.status(500).json({ error: 'Error in DBclient connection' });
          return;
        }

        if (!user) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const token = uuid.v4();
        const key = `auth_${token}`;

        const userId = user._id;

        await redisClient.set(key, userId.toString(), 3600 * 24);
        res.status(200).json({ token });
      });
    })();
  },

  /**
   * Sign-out the user based on the token, from the request.
   * (The token is found and deleted from Redis).
   * Sends json responses with suitable status codes to the
   * client / user-agent.
   * @param {Request} req a http request from express route
   * @param {Response} res a http response from express route
   * @returns
   */
  getDisconnect: (req, res) => {
    const token = req.header('X-Token') || '';
    const key = `auth_${token}`;

    (async () => {
      const userId = await redisClient.get(key);

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await redisClient.del(key);
      res.status(204);
      res.end();
    })();
  },
};
