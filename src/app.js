const express = require('express');
const app = express();
require('dotenv').config();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');

const path = require('path');
const uploadsDir = path.join(__dirname, '..', process.env.UPLOADS_DIR);

app.use(fileUpload());

// Create a new SQLite database connection
const dbPromise = sqlite.open({
  filename: process.env.SQLITE_FILE,
  driver: sqlite3.Database
});

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

    // Check if the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      // Create the uploads directory
      fs.mkdirSync(uploadsDir);
    }

    // Get a database connection
    const db = await dbPromise;

    // Create a table to store the hash table data
    db.run('CREATE TABLE IF NOT EXISTS fileHashTable (hash TEXT, fileName TEXT)');

    // Generate a hash for the file content
    let hash = crypto.createHash('sha256').update(sampleFile.data).digest('hex');

    // Check if a file with the same content and name already exists
    let row = await db.get('SELECT * FROM fileHashTable WHERE hash = ? AND fileName = ?', [hash, sampleFile.name]);
    if (row) {
      console.log(row);
      // File with the same content and name already exists
      return res.status(200).send('File already exists!');
    }
    // Check if a file with the same content already exists
    row = await db.get('SELECT * FROM fileHashTable WHERE hash = ?', [hash]);
    if (row) {
      console.log(row);
      await db.run('INSERT INTO fileHashTable (hash, fileName) VALUES (?, ?)', [hash, sampleFile.name]);
      // File with the same content already exists
      return res.status(200).send('File uploaded!');
    }

    let fullFilePath = uploadsDir + '/' + sampleFile.name;
    await new Promise((resolve, reject) => {
      sampleFile.mv(fullFilePath, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Add the hash of file to db
    await db.run('INSERT INTO fileHashTable (hash, fileName) VALUES (?, ?)', [hash, sampleFile.name]);

    return res.status(200).send('File uploaded!');

  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});

app.get('/file/:name', async (req, res) =>{
  try {
  let fileName = req.params.name;

  // Get a database connection
  const db = await dbPromise;

  // Find the file in the hash table
  row = await db.get('SELECT * FROM fileHashTable WHERE fileName = ?', [fileName]);
    if (!row || !fs.existsSync(uploadsDir + '/' + row.fileName)) {
      return res.status(404).send('File not found!');
    }

    return res.status(200).sendFile(uploadsDir + '/' + row.fileName);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error!");
  }
});

app.delete('/file/:name', async(req, res) => {
  try {
    let fileName = req.params.name;
    let filePath = uploadsDir + '/' + fileName;

    // Get a database connection
    const db = await dbPromise;

    row = await db.get('SELECT * FROM fileHashTable WHERE fileName = ?', [fileName]);

    if (!row) {
      return res.status(404).send('File not found!');
    }

    // Delete the file info from db
    await db.run('DELETE FROM fileHashTable WHERE fileName = ?', [fileName]);

    fs.unlink(filePath, function(err) {
      if (err) {
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