const express = require('express');
const app = express();
require('dotenv').config();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const { getDbClient } = require('./db');

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

    // Get a database connection
    const db = await getDbClient();

    // Create a table to store the hash table data
    await db.query('CREATE TABLE IF NOT EXISTS fileHashTable (hash TEXT, fileName TEXT, displayName TEXT)');

    // Generate a hash for the file content
    let hash = crypto.createHash('sha256').update(sampleFile.data).digest('hex');
    let uniqFileName = hash.substring(0, 10) + '_' + sampleFile.name;

    // Check if a file with the same content and name already exists
    let result = await db.query('SELECT * FROM fileHashTable WHERE hash = $1 AND displayName = $2', [hash, sampleFile.name]);

    if (result.rows.length > 0) {
      console.log(result.rows);
      console.log("File already exists!");
      return res.status(200).send('File uploaded!');
    }
    
    // Check if a file with the same content already exists
    result = await db.query('SELECT * FROM fileHashTable WHERE hash = $1', [hash]);
    if (result.rows.length > 0) {
      console.log(result.rows);
      console.log("File with the same content already exists!");
      // Add the file to the hash table with display name is different from file name
      await db.query('INSERT INTO fileHashTable (hash, fileName, displayName) VALUES ($1, $2, $3)', [hash, result.rows[0].filename, sampleFile.name]);
      // File with the same content already exists
      return res.status(200).send('File uploaded!');
    }

    // Add the file to the hash table
    await db.query('INSERT INTO fileHashTable (hash, fileName, displayName) VALUES ($1, $2, $3)', [hash, uniqFileName, sampleFile.name]);

    let fullFilePath = uploadsDir + '/' + uniqFileName;
    await new Promise((resolve, reject) => {
      sampleFile.mv(fullFilePath, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return res.status(200).send('File uploaded!');

  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});

app.get('/file/:name', async (req, res) => {
  try {
    let displayName = req.params.name;

    // Get a database connection
    const db = await getDbClient();

    // Find the file in the hash table
    let result = await db.query('SELECT * FROM fileHashTable WHERE displayName = $1', [displayName]);
    if (result.rows.length === 0 || !fs.existsSync(uploadsDir + '/' + result.rows[0].filename)) {
      console.log(uploadsDir + '/' + result.rows[0].filename);
      return res.status(404).send('File not found!');
    }

    return res.status(200).sendFile(uploadsDir + '/' + result.rows[0].filename);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});

app.delete('/file/:name', async (req, res) => {
  try {
    let displayName = req.params.name;

    // Get a database connection
    const db = await getDbClient();

    let result = await db.query('SELECT * FROM fileHashTable WHERE displayName = $1', [displayName]);

    if (result.rows.length === 0) {
      return res.status(404).send('File not found!');
    }

    // Get hash of file and check if there are other files with the same hash.
    // If there are no other files with the same hash, delete the file from both the db and the file system.
    // If there are other files with the same hash, delete the file info from the db.
    const hash = result.rows[0].hash;

    let rowLength = await db.query('SELECT COUNT(*) as Total FROM fileHashTable WHERE hash = $1', [hash]);
    console.log(rowLength.rows);

    if (rowLength.rows[0].total > 1) {
      // Delete the file info from db
      await db.query('DELETE FROM fileHashTable WHERE fileName = $1 AND displayName = $2', [result.rows[0].filename, displayName]);
      return res.status(200).send('File deleted!');
    }

    result = await db.query('SELECT * FROM fileHashTable WHERE hash = $1', [hash]);
    const filePath = uploadsDir + '/' + result.rows[0].filename;
    // Delete the file info from db
    await db.query('DELETE FROM fileHashTable WHERE fileName = $1 AND displayName = $2', [result.rows[0].filename, displayName]);

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