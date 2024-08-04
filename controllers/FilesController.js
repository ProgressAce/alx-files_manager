// Handles the functionality for endpoints concerning files
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const fs = require('fs');
const ObjectId = require('mongodb/lib/core/index').BSON;
const uuid = require('uuid');

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
    //return new Promise((resolve, reject) => {
      if (!name) {
        //reject();
        res.status(400).json({'error': 'Missing name'});
        return 0;
      }
      
      const typeList = ['folder', 'file', 'image'];
      if ( !type || !(typeList.includes(type)) ) {
        //reject();
        res.status(400).json({'error': 'Missing type'});
        return 0;
      }

      if (!data && type !== 'folder') {
        //reject();
        res.status(400).json({'error': 'Missing data'});
        return 0;
      }

      // if file being created has a specified parent (meaning parent folder)
      if (parentId) {
        try {
          const file = await dbClient.findOneFile({'_id': ObjectId(parentId)});
          if (!file) {
            res.status(400).json({'error': 'Parent not found'});
            return 0;
          }

          if (file.type !== 'folder') {
            res.status(400).json({'error': 'Parent is not a folder'});
            return 0;
          }

        } catch (error) {
          console.log('postUploadValidate findOne error:', error);
          res.status(500).json({'error': 'Server-side error'});
          return 0;
        }
      }

      return 1;
    //});
  }
  /**
   * Creates a new file representation as a document and saves to the database.
   * Requires authorization.
   * @param {import('express').Request} req the http request
   * @param {import('express').Response} res the http response
   * @returns {JSON}
   */
  async postUpload(req, res) {
    const token = req.header('X-Token');

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({'error': 'Unauthorized'});

    const { name, type, parentId } = req.body;
    const { isPublic, data } = req.body;

    // checks argument validity and sends a response accordingly
    const argsValid = await FilesController.postUploadValidate(
      res, req, name, type, parentId, isPublic, data
    );
    if (!argsValid) return;

    let file = {
      'userId': userId,
      'name': name,
      'type': type,
      'parentId': parentId || 0,
      'isPublic': isPublic || false,
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
          return res.status(500).json({'error': 'Server-side error occured'});
        }

        return res.status(201).json({
          "id": file._id,
          userId,
          name,
          type,
          isPublic,
          parentId,
        });
      }

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // insert file type of 'file' or 'image'.
      const localPath = `${folderPath}/${uuid.v4()}`;
      const decodedFileData = Buffer.from(data, 'base64').toString('utf-8');

      fs.writeFileSync(localPath, decodedFileData);

      file['localPath'] = localPath;
      const result = await dbClient.insertOneFile(file);
      if (!result || !result.result.ok) {
        return res.status(500).json({'error': 'Server-side error occured'});
      }

      return res.status(201).json({
        "id": file._id,
        userId,
        name,
        type,
        isPublic,
        parentId,
        localPath
      });

    } catch (error) {
      return res.status(500).json({'error': 'Server-side error occured'});
    }
  }
}

const filesController = new FilesController();

module.exports = filesController;