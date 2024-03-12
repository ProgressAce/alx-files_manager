// Handles the connection to the DB client.

const { MongoClient } = require('mongodb');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '27017';
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${DB_HOST}:${DB_PORT}`;

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

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const userDocNb = await this.users.find().count();
    return userDocNb;
  }

  async nbFiles() {
    const filesDocNb = await this.files.find().count();
    return filesDocNb;
  }
}

const dbClient = new DBClient();

export default dbClient;
