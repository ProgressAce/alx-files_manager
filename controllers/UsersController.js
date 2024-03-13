// contains the definitions for the user endpoints of the api.

import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');

module.exports = {
  /**
   * Creates a new user and inserts it into the database.
   * Sends json responses with suitable status codes to the
   * client / user-agent.
   * @param {Request} req a http request from express route
   * @param {Response} res a http response from express route
   * @returns nothing
   */
  postNew: (req, res) => {
    const email = req.body.email || undefined;
    const password = req.body.password || undefined;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    (async () => {
      if (await dbClient.users.findOne({ email })) {
        // console.log(await dbClient.users.findOne({ email })); cursor object moved
        res.status(400).json({ error: 'Already exist' });
        return;
      }

      // create sha1 password and store as byte buffer
      const sha1Pwd = sha1(password, 'utf-8');

      // insert new user into database
      await dbClient.users.insertOne({ email, password: sha1Pwd })
        .then(async () => {
          await dbClient.users.findOne({ email }, (err, user) => {
            if (err) {
              console.log('db error while returning feedback for creating new user:');
              console.log(err);
              res.json({ message: 'unable to send confirmation message. If email exists then it was successfully created' });
              return;
            }
            res.status(201).json({ id: user._id, email });
          });
        });
    })(); // async for waiting for db feedback
  },

  /**
   * Gets the user based on the token, taken from the request.
   * Sends json responses with suitable status codes to the
   * client / user-agent.
   * @param {Request} req a http request from express route
   * @param {Response} res a http response from express route
   */
  getMe: (req, res) => {
    const token = req.header('X-Token') || '';
    const key = `auth_${token}`;

    (async () => {
      const userId = await redisClient.get(key);

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // mongodb uses its own ObjectId type for reserved id values.
      const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
      res.json({ _id: userId, email: user.email });
    })();
  },
};
