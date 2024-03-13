// Handles a client connection to Redis

import { createClient } from 'redis';

// handles the mongo database(db) client connection
class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = false;

    this.client.on('error', (err) => console.log(`Redis client not connected: ${err}`));
    this.client.on('connect', () => {
      this.connected = true;
    });
  }

  /**
   * Checks if redis connection is active.
   * @returns true, if the db client connection is active
   * otherwise false.
   */
  isAlive() {
    return this.connected;
  }

  /**
   * Finds the value of the key in Redis
   * @param {String} key the variable reference
   * @returns if found, the value associated with the key
   * otherwise null.
   */
  async get(key) {
    // promise ensuring redisGet command finishes execution before returning
    const redisGetPromise = new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          reject(err);
        }
        resolve(value);
      });
    });

    try {
      const result = await redisGetPromise; // await the promise
      return result;
    } catch (e) {
      return e.message;
    }
  }

  /**
  * sets a new redis key with expiration
  * @param {string} key - the new redis key to set
  * @param {string} value - value of the redis key
  * @param {number} duration - the expiration ttl for the key
  */
  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

// ensure client connection is made
// client connection is ready at this point

const redisClient = new RedisClient();

export default redisClient;
