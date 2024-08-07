// Defines the background processing for generating thumbnails for images
const bull = require('bull');
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
const { ObjectId } = require('mongodb/lib/core/index').BSON;
const dbClient = require('./utils/db');

const fileQueue = bull('fileQueue');

fileQueue.process('thumbnail generation', 1, async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) done(new Error('Missing fileId'));
  if (!userId) done(new Error('Missing userId'));

  const file = await dbClient.findOneFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) done(new Error('File not found'));

  const filePath = file.localPath;
  try {
    const thumbnail500 = await imageThumbnail(filePath, { width: 500 });
    const thumbnail250 = await imageThumbnail(filePath, { width: 250 });
    const thumbnail100 = await imageThumbnail(filePath, { width: 100 });

    fs.writeFileSync(`${filePath}_500`, thumbnail500);
    fs.writeFileSync(`${filePath}_250`, thumbnail250);
    fs.writeFileSync(`${filePath}_100`, thumbnail100);
  } catch (error) {
    console.log('worker.js error:', error);
    done(new Error(error.message));
  }

  done();
});
