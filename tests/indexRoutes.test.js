// Tests the endpoints that index.js defines.
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = require('chai').should;
const server = require('../server');

describe('The endpoints for index.js\'s routes', async function () {

  describe('GET /status', function () {
    it('should return GET characteristics', function (done) {
      chai.request(server).get('/status')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object')
            done--
        })
    });
    
    it('retrieves the status of clients db and redis', function (done) {
      chai.request(server).get('/status')
        .end((err, res) => {
            res.body.should.have.property('redis').which.is.a('boolean');
            res.body.should.have.property('db').which.is.a('boolean');
        })
    });
  });

  describe('GET /stats', function () {
    it('should return GET characteristics', function (done) {
        chai.request(server).get('/stats')
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.should.be.a('object')
          })
      });

    it('', function (done) {
        chai.request(server).get('/stats')
        .end((err, res) => {
            res.body.should.have.property('users').which.is.a('number');
            res.body.should.have.property('files').which.is.a('number');
        })
    });
  });

  describe('POST /users', function () {
    it('should create a new user', function (done) {
      chai.request(server).post('/users')
        .send({ email: 'sponge@b.com', password: 'toto1234!' })
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('id').which.is.a('string');
          res.body.should.have.property('email').which.is.a('string');
        })
    });

    it('should not create a user with an existing email', function (done) {
        chai.request(server).post('/users')
        .send({ email: 'sponge@b.com', password: 'toto1234!' })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error').which.is.a('string');
        })
    })

    it('does not allow creation of a user without a password', function (done) {
        chai.request(server).post('/users')
        .send({ email: 'sandy@b.com' })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error').which.is.a('string');
        })
    });
  })

  let token;  // save token for following tests
  
  describe('GET /connect', function () {
    it('should get a basic auth token', function (done) {
        chai.request(server).get('/connect')
          .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE')
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('token').which.is.a('string');
              token = res.body.token;
          })
    });
  })
  

  describe('GET /disconnect', function () {
    it('returns 204 after successful disconnect', function (done) {
        chai.request(server).get('/disconnect')
        .set('X-Token', token)
        .end((err, res) => {
            res.should.have.status(204);
        })
    })
  })

  /*
  describe('GET /users/me', function () {
    chai.request(server).get('/users/me')
        .set('X-Token', token)
        .end((err, res) => {
            res.should.have.status(204);
        })

    it('', function (done) {
      expect()
    })
  })

  describe('POST /files', function () {
    it('', function (done) {
      expect()
    })

    it('', function (done) {
      expect()
    })
  })

  describe('GET /files/:id', function () {
    it('', function (done) {
      expect()
    })

    it('', function (done) {
      expect()
    })
  })

  describe('GET /files', function () {
    it('', function (done) {
      expect()
    })

    it('don’t forget the pagination', function (done) {
      expect()
    })
  })

  describe('PUT /files/:id/publish', function () {
    it('', function (done) {
      expect()
    })

    it('', function (done) {
      expect()
    })
  })

  describe('PUT /files/:id/unpublish', function () {
    it('', function (done) {
      expect()
    })

    it('', function (done) {
      expect()
    })
  })

  describe('GET /files/:id/data', function () {
    it('', function (done) {
      expect()
    })

    it('', function (done) {
      expect()
    })
  })
    */
})