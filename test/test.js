const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
app.use(fileUpload());
const uploadRoute = require('../src/app'); 
app.use(uploadRoute);

describe('POST /upload', () => {
  let dbMock;
  let cryptoMock;
  let fsMock;
  let dbInstanceMock;

  beforeEach(() => {
    dbMock = sinon.mock(require('sqlite'));
    cryptoMock = sinon.mock(require('crypto'));
    fsMock = sinon.mock(require('fs'));

    dbInstanceMock = {
        run: sinon.stub(),
        get: sinon.stub()
      };
      dbMock.expects('open').returns(dbInstanceMock);
  });

  afterEach(() => {
    dbMock.restore();
    cryptoMock.restore();
    fsMock.restore();
  });

  it('should return 400 if no files were uploaded', async () => {
    const res = await request(app)
      .post('/upload')
      .send();
    
    expect(res.status).equal(400);
    expect(res.text).equal('No files were uploaded.');
  });

  it('should return 200 if file already exists', async () => {
    const fileContent = 'test file content';
    const fileName = 'test.txt';
    const fileHash = 'testhash';
    console.log(cryptoMock);
    dbInstanceMock.run.withArgs(sinon.match.string);
    dbInstanceMock.get.withArgs(sinon.match.string, [fileHash, fileName]).resolves({});
    cryptoMock.expects('createHash').once().withArgs('sha256').returns({
      update: sinon.stub().returnsThis(),
      digest: sinon.stub().returns(fileHash)
    });

    const res = await request(app)
      .post('/upload')
      .attach('sampleFile', Buffer.from(fileContent), fileName);
      
    expect(res.status).toEqual(200);
    expect(res.text).toEqual('File already exists!');

    dbMock.verify();
    cryptoMock.verify();
  });

  // Add more test cases here
});
