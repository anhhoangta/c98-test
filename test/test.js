const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

// Set the SQLITE_FILE and UPLOADS_DIR environment variables to the path of the test database file
process.env.SQLITE_FILE = 'data/test/test.db';
process.env.UPLOADS_DIR = 'data/test';

const server = require('../src/index');
chai.use(chaiHttp);
chai.should();

describe('File Upload', () => {
  const fileName = 'test.txt';
  const fileWithTheSameContent = 'test2.txt';

  it('should upload a file successfully', (done) => {
    chai.request(server)
      .post('/upload')
      .attach('sampleFile', fs.readFileSync(__dirname + '/' + fileName), fileName)
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.eql('File uploaded!');
        done();
      });
  });

  it('should not add to db if both file name and file content are the same', (done) => {
    chai.request(server)
      .post('/upload')
      .attach('sampleFile', fs.readFileSync(__dirname + '/' + fileName), fileName)
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.eql('File already exists!');
        done();
      });
  });

  it('should add to db if file name is different but file content is the same', (done) => {
    chai.request(server)
      .post('/upload')
      .attach('sampleFile', fs.readFileSync(__dirname + '/' + fileWithTheSameContent), fileWithTheSameContent)
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.eql('File uploaded!');
        done();
      });
  });

  it('should retrieve a file successfully by name', (done) => {
    chai.request(server)
      .get('/file/' + fileName)
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.eql(fs.readFileSync(__dirname + '/' + fileName).toString());
        done();
      });
  });

  it('should receive a 404 when retrieving a file that does not exist', (done) => {
    chai.request(server)
      .get('/file/doesnotexist.txt')
      .end((err, res) => {
        res.should.have.status(404);
        res.text.should.be.eql('File not found!');
        done();
      });
  });

  it('should delete a file successfully by name', (done) => {
    chai.request(server)
      .delete('/file/' + fileName)
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.eql('File deleted!');
        done();
      });
  });

  it('should receive a 404 when deleting a file that does not exist', (done) => {
    chai.request(server)
      .delete('/file/doesnotexist.txt')
      .end((err, res) => {
        res.should.have.status(404);
        res.text.should.be.eql('File not found!');
        done();
      });
  });
});
