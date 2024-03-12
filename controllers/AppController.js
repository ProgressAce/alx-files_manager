// contains the definitions for the basic endpoints of the api.

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

module.exports = {
  getStatus: (res) => {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  },
  getStats: (res) => {
    (async () => {
      const userNb = await dbClient.nbUsers();
      const fileNb = await dbClient.nbFiles();
      res.status(200).json({ users: userNb, files: fileNb });
    })();
  },
};
