// Tests the DBClient class
const expect = require('chai').expect;
const { promisify } = require('util');
const dbClient = require('../utils/db');
const directClient = require('../utils/db').db;

describe('DBClient class', async function () {
  
  /*
  it('provides a DBClient instance', function (done) {
    expect(this.client) instanceof DBClient
  })*/
  
  it('checks the connection status to the mongodb client', async function (done) {
    // when mongo service has been started...
    expect(dbClient.isAlive()).to.be.true;
    done();
  });

  it('gets total number of user documents in the database', async function (done) {
    expect(await dbClient.nbUsers()).to.be.a.string();
    done();
  });

  it('gets total number of file documents in the database', async function (done) {
    expect(await dbClient.nbFiles()).to.be.a.string();
    done();
  });
});
