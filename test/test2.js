const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const express = require('express');
const fs = require('fs');

// Set the SQLITE_FILE and UPLOADS_DIR environment variables to the path of the test database file
process.env.SQLITE_FILE = 'data/test/test.db';
process.env.UPLOADS_DIR = 'data/test';

// const server = require('../src/index');
chai.use(chaiHttp);
chai.should();

describe('File Upload', () => {
  let app;
  let dbPromise;
  let server;

  beforeEach(() => {
    // Create a mock version of the dbPromise object
    dbPromise = Promise.resolve({
      get: sinon.stub(),
      run: sinon.stub(),
    });

    // Create a mock version of the app object
    app = proxyquire('../src/app', {
      './db': { dbPromise },
    });

    // Start the server using the mock app object
    server = app.listen();
  });

  afterEach(() => {
    server.close();
  });

  const fileName = 'test.txt';
  const fileWithTheSameContent = 'test2.txt';

  it('should upload a file successfully', async () => {
    const res = await chai.request(server)
      .post('/upload')
      .attach('sampleFile', fs.readFileSync(__dirname + '/' + fileName), fileName);
      
        res.should.have.status(200);
        res.text.should.be.eql('File uploaded!');
    });

  it('should not add to db if both file name and file content are the same', async () => {
    const res = await chai.request(server)
      .post('/upload')
      .attach('sampleFile', fs.readFileSync(__dirname + '/' + fileName), fileName);

        res.should.have.status(200);
        res.text.should.be.eql('File already exists!');
    });

  it('should add to db if file name is different but file content is the same', async () => {
    const res = await chai.request(server)
      .post('/upload')
      .attach('sampleFile', fs.readFileSync(__dirname + '/' + fileWithTheSameContent), fileWithTheSameContent);
      
        res.should.have.status(200);
        res.text.should.be.eql('File uploaded!');
    });

  it('should retrieve a file successfully by name', async () => {
    const res = await chai.request(server)
      .get('/file/' + fileName);
      
        res.should.have.status(200);
        res.text.should.be.eql(fs.readFileSync(__dirname + '/' + fileName).toString());
    });

  it('should receive a 404 when retrieving a file that does not exist', async () => {
    const res = await chai.request(server)
      .get('/file/doesnotexist.txt');

        res.should.have.status(404);
        res.text.should.be.eql('File not found!');
    });

  it('should delete a file successfully by name', async () => {
    const res = await chai.request(server)
      .delete('/file/' + fileName);

        res.should.have.status(200);
        res.text.should.be.eql('File deleted!');
    });

  it('should receive a 404 when deleting a file that does not exist', async () => {
    const res = await chai.request(server)
      .delete('/file/doesnotexist.txt');
      
        res.should.have.status(404);
        res.text.should.be.eql('File not found!');
    });
});