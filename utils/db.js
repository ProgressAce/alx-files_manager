// Handles the connection to the DB client.

import MongoClient from 'mongodb/lib/mongo_client';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '27017';
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${DB_HOST}:${DB_PORT}`;

// handles the mongo database(db) client connection
class DBClient {
  constructor() {
    MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        this.db = client.db(DB_DATABASE); // provides interface connection
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } else {
        console.log(`DB client connection failed: ${err}`);
      }
    });
  }

  /**
   * Checks if db connection is active.
   * @returns true, if the db client connection is active
   * otherwise false.
   */
  isAlive() {
    return Boolean(this.db);
  }

  /**
   * Gets the total number of user documents in the user collection
   * of the files_manager MongoDB database.
   * @returns the total number of user documents in the user collection.
   */
  async nbUsers() {
    const userDocNb = await this.users.find().count();
    return userDocNb;
  }

  /**
   * Gets the total number of file documents in the user collection
   * of the files_manager MongoDB database.
   * @returns the total number of file documents in the user collection.
   */
  async nbFiles() {
    const filesDocNb = await this.files.find().count();
    return filesDocNb;
  }
}

const dbClient = new DBClient();

export default dbClient;
