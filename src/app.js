const express = require('express');
const app = express();
require('dotenv').config();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { createTable, getFileByName, getFileByHashAndName, getFileByHash, getFileCountByHash, addFile, deleteFile } = require('./db');
const { createHash } = require('./helper');

const path = require('path');
const uploadsDir = path.join(__dirname, '..', process.env.UPLOADS_DIR);

app.use(fileUpload());

// Create health check endpoint
app.get('/health', function(req, res) {
  return res.status(200).send('OK');
});

app.post('/upload', async(req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile;

    // Create a table if not exist to store the hash table data
    await createTable();

    // Generate a hash for the file content
    let hash = createHash(sampleFile.data);
    let saveFileName = hash.substring(0, 10) + '_' + sampleFile.name;

    // Check if a file with the same content and name already exists
    let rows = await getFileByHashAndName(hash, sampleFile.name);

    if (rows.length > 0) {
      console.log(rows);
      console.log("File already exists!");
      return res.status(200).send('File uploaded!');
    }
    
    // Check if a file with the same content already exists
    rows = await getFileByHash(hash);
    if (rows.length > 0) {
      console.log(rows);
      console.log("File with the same content already exists!");
      // Add the file to the hash table with display name is different from file name
      await addFile(hash,rows[0].filename,sampleFile.name);
      // File with the same content already exists
      return res.status(200).send('File uploaded!');
    }

    // Add the file to the hash table
    await addFile(hash,saveFileName,sampleFile.name);

    let fullFilePath = uploadsDir + '/' + saveFileName;
    await fs.promises.writeFile(fullFilePath, sampleFile.data);

    return res.status(200).send('File uploaded!');

  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});

app.get('/file/:name', async (req, res) => {
  try {
    let displayName = req.params.name;

    // Find the file in the hash table
    let rows = await getFileByName(displayName);
    if (rows.length === 0) {
      return res.status(404).send('File not found!');
    }

    return res.status(200).sendFile(uploadsDir + '/' + rows[0].filename);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});

app.delete('/file/:name', async (req, res) => {
  try {
    let displayName = req.params.name;

    let rows = await getFileByName(displayName);

    if (rows.length === 0) {
      return res.status(404).send('File not found!');
    }

    // Get hash of file and check if there are other files with the same hash.
    // If there are no other files with the same hash, delete the file from both the db and the file system.
    // If there are other files with the same hash, delete the file info from the db.
    const hash = rows[0].hash;

    let rowLength = await getFileCountByHash(hash);
    console.log(rowLength);

    if (rowLength > 1) {
      // Delete the file info from db
      await deleteFile(rows[0].filename, displayName);
      return res.status(200).send('File deleted!');
    }

    rows = await getFileByHash(hash);
    const filePath = uploadsDir + '/' + rows[0].filename;
    // Delete the file info from db
    await deleteFile(rows[0].filename, displayName);

    fs.unlink(filePath, function (err) {
      if (err) {
        console.log(err);
        return res.status(500).send("Delete file error!");
      }

      return res.status(200).send('File deleted!');
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});


module.exports = app;