// Definition of index's endpoints.
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  /**
   * Checks whether the redis and db clients are alives.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };

    return res.status(200).json(status);
  }

  /**
   * Returns the number of users and files in the database.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   */
  static async getStats(req, res) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };

    return res.status(200).json(stats);
  }
}

module.exports = AppController;
