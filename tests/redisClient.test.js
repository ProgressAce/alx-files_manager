// Tests the redis client class
const expect = require('chai').expect;
const { promisify } = require('util');
const redisClient = require('../utils/redis');
const directClient = require('../utils/redis').client;

describe('RedisClient class', async function () {
  const get = promisify(directClient.get).bind(directClient);
  const set = promisify(directClient.set).bind(directClient);
  await set('my_key', '35436');

  /*
  it('provides a RedisClient instance', function (done) {
    expect(this.client) instanceof RedisClient
  })*/
  
  it('sets a key/value pair in the local redis db', async function (done) {
    await redisClient.set('tKey', 'I am here', 15);

    expect(await get('tKey')).to.equal('I am here');
    done();
  });

  it('gets the value of a key in the local redis db', async function (done) {
    expect(redisClient.get(my_key)).to.equal('35436');
    done();
  });

  it('deletes a key and its value', async function (done) {
    await redisClient.del('my_key');

    expect(await get('my_key')).to.be.null;
    done();
  });  
});
