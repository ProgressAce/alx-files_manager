// Handles a client connection to Redis

import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = false;

    this.client.on('error', (err) => console.log(`Redis client not connected: ${err}`));
    this.client.on('connect', () => {
      this.connected = true;
    });
  }

  isAlive() {
    return this.connected;
  }

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
