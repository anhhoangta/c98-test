const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const crypto = require('crypto');

app.use(fileUpload());

// Create an object to store the hash table
let fileHashTable = {};

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  let sampleFile = req.files.sampleFile;
  let uploadPath = __dirname + '/uploads/';

  // Check if the uploads directory exists
  if (!fs.existsSync(uploadPath)) {
    // Create the uploads directory
    fs.mkdirSync(uploadPath);
  }

  // Generate a hash for the file content
  let hash = crypto.createHash('sha256').update(sampleFile.data).digest('hex');

  // Check if a file with the same content already exists
  if (fileHashTable[hash]) {

    // Check if the file name already exists in the hash table
    if (fileHashTable[hash].includes(sampleFile.name)) {
      return res.status(200).send('File already exists!');
    }

    // Add the new file name to the hash table
    fileHashTable[hash].push(sampleFile.name);
    console.log(fileHashTable);
    return res.status(200).send('File with the same content already exists!');
  } else {
    // Add the file to the hash table
    fileHashTable[hash] = [sampleFile.name];
  }
  console.log(fileHashTable);

  let fullFilePath = uploadPath + sampleFile.name;
  sampleFile.mv(fullFilePath, function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.get('/file/:name', function(req, res) {
  let fileName = req.params.name;

  // Find the file in the hash table
  let fileFound = false;
  let filePath;
  for (let hash in fileHashTable) {
    if (fileHashTable[hash].includes(fileName)) {
      filePath = __dirname + '/uploads/' + fileHashTable[hash][0];
      fileFound = true;
      break;
    }
  }

  if (!fileFound || !fs.existsSync(filePath)) {
    return res.status(404).send('File not found!');
  }

  return res.status(200).sendFile(filePath);
});


app.delete('/file/:name', function(req, res) {
  let fileName = req.params.name;
  let filePath = __dirname + '/uploads/' + fileName;

  // Find the file in the hash table
  let fileFound = false;
  let fileHash;
  for (let hash in fileHashTable) {
    if (fileHashTable[hash].includes(fileName)) {
      fileFound = true;
      fileHash = hash;
      break;
    }
  }

  if (!fileFound) {
    return res.status(404).send('File not found!');
  }

  // Remove the file from the hash table
  let index = fileHashTable[fileHash].indexOf(fileName);
  if (index > -1) {
    fileHashTable[fileHash].splice(index, 1);
    console.log(fileHashTable);
    return res.status(200).send('File deleted!');
  }

  // Remove the hash from the hash table if there are no more files with the same content
  if (fileHashTable[fileHash].length === 0) {
    delete fileHashTable[fileHash];
  }

  console.log(fileHashTable);

  fs.unlink(filePath, function(err) {
    if (err) {
      return res.status(500).send("Delete file error!");
    }

    res.send('File deleted!');
  });
});

module.exports = app;