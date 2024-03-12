// contains the definitions for the user endpoints of the api.

import dbClient from '../utils/db';

const crypto = require('crypto');

module.exports = {
  postNew: (req, res) => {
    const email = req.body.email || undefined;
    const password = req.body.password || undefined;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    (async () => {
      if (await dbClient.users.findOne({ email })) {
        // console.log(await dbClient.users.findOne({ email })); cursor object moved
        res.status(400).json({ error: 'Already exist' });
        return;
      }

      // create hashed password and store as byte buffer
      const hashPwd = crypto.createHash('sha1').update(password, 'utf-8').digest();

      // insert new user into database
      await dbClient.users.insertOne({ email, password: hashPwd })
        .then(async () => {
          await dbClient.users.findOne({ email }, (err, user) => {
            if (err) {
              console.log('db error while returning feedback for creating new user:');
              console.log(err);
              res.json({ message: 'unable to send confirmation message. If email exists then it was successfully created' });
              return;
            }
            res.status(201).json({ id: user._id, email });
          });
        });
    })(); // async for waiting for db feedback
  },
};
