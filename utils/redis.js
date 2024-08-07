// Handles the redis client connection and interaction.
const { createClient } = require('redis');
const { promisify } = require('util');

/**
 * Represents a Redis client connection.
 */
class RedisClient {
  constructor() {
    this.client = createClient()
      .on('error', (error) => console.log(`Error creating redis client connection: ${error}`));

    this.getPromise = promisify(this.client.get).bind(this.client);
    this.setPromise = promisify(this.client.set).bind(this.client);
    this.delPromise = promisify(this.client.del).bind(this.client);
  }

  /**
   * Determines whether the connection to redis is active.
   * @returns True, when the connection to Redis is a success otherwise, `false`
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Obtains the value of the key, stored in Redis.
   * @param {string} key
   * @returns the value of the key.
   */
  async get(key) {
    try {
      const value = await this.getPromise(key);
      return value;
    } catch (error) {
      console.log('RedisClient getPromise error:', error);
      return null;
    }
  }

  /**
   * Stores a key/value pair in Redis, with an expiration time.
   * @param {string} key the identifier of the value
   * @param {string} value the value belonging to the key
   * @param {number} duration the expiration time of this key/value pair, in seconds.
   */
  async set(key, value, duration) {
    try {
      await this.setPromise(key, value, 'EX', duration);
    } catch (error) {
      console.log('RedisClient setPromise error:', error);
    }
  }

  /**
   * Deletes the value for the given key, in Redis.
   * @param {string} key unique identifier in Redis.
   */
  async del(key) {
    try {
      await this.delPromise(key);
    } catch (error) {
      console.log('RedisClient delPromise error:', error);
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
