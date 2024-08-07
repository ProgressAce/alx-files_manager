// Handles the functionality for endpoints concerning files
const Bull = require('bull');
const fs = require('fs');
const mime = require('mime-types');
const uuid = require('uuid');
const { ObjectId } = require('mongodb/lib/core/index').BSON;
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  /**
   * Validates each argument for the postUpload function, a controller
   * meant for the POST endpoint /files.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @param {string} name the file name argument
   * @param {string} type the file type argument
   * @param {string} parentId the file parentId argument
   * @param {string} isPublic the file isPublic argument
   * @param {string} data the file data argument
   */
  static async postUploadValidate(res, req, name, type, parentId, isPublic, data) {
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return 0;
    }

    const typeList = ['folder', 'file', 'image'];
    if (!type || !(typeList.includes(type))) {
      res.status(400).json({ error: 'Missing type' });
      return 0;
    }

    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return 0;
    }

    // if file being created has a specified parent (meaning parent folder)
    if (parentId) {
      try {
        const file = await dbClient.findOneFile({ _id: ObjectId(parentId) });
        if (!file) {
          res.status(400).json({ error: 'Parent not found' });
          return 0;
        }

        if (file.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
          return 0;
        }
      } catch (error) {
        // console.log('postUploadValidate findOne error:', error);
        res.status(500).json({ error: 'Server-side error' });
        return 0;
      }
    }

    return 1;
  }

  /**
   * Creates a new file representation as a document and saves to the database.
   * Requires authorization.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  static async postUpload(req, res) {
    const token = req.header('X-Token');

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId = 0 } = req.body;
    const { isPublic = false, data } = req.body;

    // checks argument validity and sends a response accordingly
    const argsValid = await FilesController.postUploadValidate(
      res, req, name, type, parentId, isPublic, data,
    );
    if (!argsValid) return null;

    const file = {
      userId: ObjectId(userId),
      name,
      type,
      parentId,
      isPublic,
    };

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    // TODO: have the arguments validated so that they are not needed in dbClient
    // method.
    // TODO: Any file type that already exists (has same path) in the file system
    // is overwritten in the file system, so the same should be done in the database,
    // so as not to create duplicates with different db IDs.
    try {
      if (type === 'folder') {
        const result = await dbClient.insertOneFile(file);
        if (!result || !result.result.ok) {
          return res.status(500).json({ error: 'Server-side error occured' });
        }

        return res.status(201).json({
          id: file._id,
          userId: file.userId,
          name: file.name,
          type: file.type,
          isPublic: file.isPublic,
          parentId: file.parentId,
        });
      }

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // insert file type of 'file' or 'image'.
      const localPath = `${folderPath}/${uuid.v4()}`;
      const decodedFileData = Buffer.from(data, 'base64').toString('utf-8');

      fs.writeFileSync(localPath, decodedFileData);

      file.localPath = localPath;
      const result = await dbClient.insertOneFile(file);
      if (!result || !result.result.ok) {
        return res.status(500).json({ error: 'Server-side error occured' });
      }

      if (file.type.type === 'image') {
        const fileQueue = new Bull('fileQueue');
        fileQueue.add('thumbnail generation', {
          userId: file.userId,
          fileId: file._id,
        });
      }

      return res.status(201).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Server-side error occured' });
    }
  }

  /**
   * Retrieve the file document based on the given file ID:
   *
   * Requires authorization.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  static async getShow(req, res) {
    const token = req.header('X-Token');
    const { id } = req.params;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.findOneFile({ _id: ObjectId(id), userId: ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Retrieves all the user's file documents for a specific parentId
   * with pagination.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  static async getIndex(req, res) {
    const token = req.header('X-Token');

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId = 0, page = 0 } = req.query;

    // check for existence of the parent file, which is of type folder.
    if (parentId) {
      const file = await dbClient.findOneFile({ _id: ObjectId(parentId) });
      if (!file || file.type !== 'folder') {
        return res.status(200).json([]);
      }
    }

    const files = [];
    const query = {
      userId: ObjectId(userId),
      parentId,
    };
    const fileAggregationCursor = await dbClient.findUserFiles(query, page);

    for await (const file of fileAggregationCursor) {
      files.push({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    }

    return res.status(200).json(files);
  }

  /**
   * Sets a file's isPublic field to true.
   *
   * Authorization is required.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  static async putPublish(req, res) {
    const token = req.header('X-Token');
    const { id } = req.params;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let file;

    try {
      file = await dbClient.files.findOneAndUpdate(
        { _id: ObjectId(id), userId: ObjectId(userId) },
        { $set: { isPublic: true } },
        { returnDocument: 'after', upsert: false },
      );

      if (!file) throw Error('file document not found');
    } catch (error) {
      console.log('FilesController putPublish error:', error);
      return res.status(404).json({ error: 'Not found' });
    }

    file = file.value;

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Sets a file's isPublic field to false.
   *
   * Authorization is required.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    const { id } = req.params;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let file;

    try {
      file = await dbClient.files.findOneAndUpdate(
        { _id: ObjectId(id), userId: ObjectId(userId) },
        { $set: { isPublic: false } },
        { returnDocument: 'after', upsert: false },
      );

      if (!file) throw Error('file document not found');
    } catch (error) {
      console.log('FilesController putUnpublish error:', error);
      return res.status(404).json({ error: 'Not found' });
    }

    file = file.value;

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Returns the content of a file document.
   *
   * The file is determined by the id provided as a parameter in the url.
   * Authorization is required.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  static async getFile(req, res) {
    const token = req.header('X-Token');
    const { id } = req.params; // the file's identifier
    const { size } = req.query;

    const userId = await redisClient.get(`auth_${token}`);

    const file = await dbClient.findOneFile({ _id: ObjectId(id) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    // check if the file is public for viewing without authorization
    if (!userId && file.isPublic === false) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: 'A folder doesn\'t have content' });
    }

    // check if the file exists locally
    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    let filePath = file.localPath;
    let fileName = file.name;

    if (file.type === 'image') {
      if (size) {
        if (['100', '250', '500'].includes(size)) {
          filePath += `_${size}`;
          fileName += `_${size}`;
        } else {
          return res.status(400).json({ error: 'Wrong image size' });
        }
      }
    }

    const mimeType = mime.contentType(fileName);
    res.setHeader('Content-Type', mimeType);

    try {
      const fileData = fs.readFileSync(filePath);
      return res.status(200).json(fileData);
    } catch (error) {
      console.log('FilesController getFile error:', error.message);
      return res.status(500).json({ error: 'Server-side error' });
    }
  }
}

module.exports = FilesController;
