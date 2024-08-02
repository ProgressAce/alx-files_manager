// Forms the MongoDB client connection and interaction.
const MongoClient = require('mongodb/lib/mongo_client');

/**
 * Represents the database connection.
 */
class DBClient {
    /**
     * Instantiates a database client.
     * @param {string} host the database host
     * @param {string} port the database port
     * @param {string} dbName the name of the database
     */
  constructor(host, port, dbName) {
    const url = `mongodb://${host}:${port}/${dbName}`;

    /**
     * @type {import('mongodb/lib/collection')} The users collection.
     */
    this.users = null;

    /**
     * @type {import('mongodb/lib/collection')} The files collection.
     */
    this.files = null;

    /**
     * Connects to the MongoDB server and initializes the client and database.
     */
    (async () => {
      try {
        this.client = await MongoClient.connect(url, { useUnifiedTopology: true });
        this.db = this.client.db(dbName);
        
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } catch (error) {
        console.log('Error creating database client:', error);
      }
    })();
  }

  /**
   * Determines if the connection is active.
   * @returns True, if the database client is connected successfully
   * otherwise, `false`.
   */
  isAlive() {
    return Boolean(this.client);
  }

  /**
   * Gives the number of documents in the users collection.
   * @returns number of users.
   */
  async nbUsers() {
    try {
      return await this.users.countDocuments();
    } catch (error) {
      console.log('nbUsers countDocuments error:', error);
      return null;
    }
  }

  /**
   * Gives the number of documents in the files collection.
   * @returns number of files.
   */
  async nbFiles() {
    try {
      return await this.files.countDocuments();
    } catch (error) {
      console.log('nbFiles countDocuments error:', error);
      return null;
    }
  }

  /**
   * Returns one document in users collection matching the filter.
   * @param {object} query the filter to find the document.
   */
  async findOneUser(query) {
    try {
      if (typeof query !== 'object') return null;

      const user = await this.users.findOne(query);
      return user;

    } catch (error) {
      console.log('findOne error:', error);
    }
  }

  /** 
   * Adds a new user to the database.
   * 
   * The email and password are not checked for validity.
   * The email is expected to have been validated and the password hashed
   * beforehand.
   * @param {string} email email of the user
   * @param {string} password password of the user
   * @returns 
   */
  async insertOneUser(email, password) {
    try {
      if (!email || !password) return 0;

      const result = await this.users.insertOne({email, password});
      return result;

    } catch (error) {
      console.log('insertOneUser error:', error);
    }
  }
}

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '27017';
const dbName = process.env.DB_DATABASE || 'files_manager';

const dbClient = new DBClient(host, port, dbName);

module.exports = dbClient;
