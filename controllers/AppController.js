// contains the definitions for the basic endpoints of the api.

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

module.exports = {
  /**
   * Sends json response of the status of the database and redis connection.
   * @param {Response} res a http response from express route
   */
  getStatus: (res) => {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  },

  /**
   * Sends json response of the total number of users and files in the database.
   * @param {Response} res a http response from express route
   */
  getStats: (res) => {
    (async () => {
      const userNb = await dbClient.nbUsers();
      const fileNb = await dbClient.nbFiles();
      res.status(200).json({ users: userNb, files: fileNb });
    })();
  },
};
