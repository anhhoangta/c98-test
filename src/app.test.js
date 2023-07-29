const request = require('supertest');
const app = require('./app');
const db = require('./db');
const mockFs = require('mock-fs');
const { createHash } = require('./helper');
const fs = require('fs');

jest.mock('./db');

describe('GET /file/:name', () => {
  beforeAll(() => {
    // Create a mock file system with a test.txt file in the uploads directory
    // and include the necessary modules for Jest
    mockFs({
      data: {
        uploads: {
          'test.txt': 'This is a test file'
        }
      },
      [require.resolve('exit')]: ''
    });
  });
  
  afterAll(() => {
    // Restore the original file system
    mockFs.restore();
  });

  test('should return 200 and the file if it exists', async () => {
    // Mock the getFile function to return a fake file record
    db.getFileByName.mockResolvedValueOnce([{ filename: 'test.txt' }]);

    // Make a GET request to the /file/test endpoint
    const res = await request(app).get('/file/test.txt');

    // Check that the response status is 200 and the body contains the expected file content
    expect(res.status).toBe(200);
    expect(res.text).toBe('This is a test file');
  });

  test('should return 404 if the file does not exist', async () => {
    // Mock the getFile function to return an empty array
    db.getFileByName.mockResolvedValueOnce([]);

    // Make a GET request to the /file/doesnotexist.txt endpoint
    const res = await request(app).get('/file/doesnotexist.txt');

    // Check that the response status is 404 and the body contains the expected error message
    expect(res.status).toBe(404);
    expect(res.text).toBe('File not found!');
  });
});

describe('POST /upload', () => {
  let displayFileName = 'test.txt';
  let hashValue = createHash(Buffer.from('This is a test file'));
  let saveFileName = hashValue.substring(0, 10) + '_' + displayFileName;
  beforeAll(() => {
    // Create mock files to simulate a file upload
    mockFs({
      data: {
        uploads: {
          'test.txt': 'This is a test file',
          'test2.txt': 'This is a test file' // Add a second file to test duplicate content
        }
      },
      [require.resolve('exit')]: ''
    });
  });
  
  afterEach(() => {
    // Restore the original file system
    mockFs.restore();
  });

  test('should return 400 if no files were uploaded', async () => {
    // Make a POST request to the /upload endpoint without any files
    const res = await request(app).post('/upload');

    // Check that the response status is 400 and the body contains the expected error message
    expect(res.status).toBe(400);
    expect(res.text).toBe('No files were uploaded.');
  });

  test('should return 200 and upload the file if it does not exist', async () => {
    // Mock the db.query function to simulate a new file upload
    db.createTable.mockResolvedValueOnce(); // CREATE TABLE IF NOT EXISTS
    db.getFileByHashAndName.mockResolvedValueOnce([]); // SELECT * FROM fileHashTable WHERE hash = $1 AND displayName = $2
    db.getFileByHash.mockResolvedValueOnce([]); // SELECT * FROM fileHashTable WHERE hash = $1
    db.addFile.mockResolvedValueOnce(); // INSERT INTO fileHashTable (hash, fileName, displayName) VALUES ($1, $2, $3)

    // Make a POST request to the /upload endpoint with the test file
    const res = await request(app)
      .post('/upload')
      .attach('sampleFile', Buffer.from('This is a test file'), displayFileName);

    // Check that the response status is 200 and the body contains the expected success message
    expect(res.status).toBe(200);
    expect(res.text).toBe('File uploaded!');

    // Check that the addFile function has been called with the expected arguments
    expect(db.addFile).toHaveBeenCalledWith(hashValue, saveFileName, 'test.txt');

    // Check that the file has been uploaded to the uploads directory
    expect(fs.existsSync('data/uploads/' + saveFileName)).toBe(true);
  });

  test('should return 200 and not upload the file if it already exists', async () => {
    // Mock the db.query function to simulate an existing file upload
    db.createTable.mockResolvedValueOnce(); // CREATE TABLE IF NOT EXISTS
    db.getFileByHashAndName.mockResolvedValueOnce([{ hash: hashValue, filename: 'test.txt' }]); // SELECT * FROM fileHashTable WHERE hash = $1 AND displayName = $2

    // Make a POST request to the /upload endpoint with the test file
    const res = await request(app)
      .post('/upload')
      .attach('sampleFile', Buffer.from('This is a test file'), 'test.txt');

    // Check that the response status is 200 and the body contains the expected success message
    expect(res.status).toBe(200);
    expect(res.text).toBe('File uploaded!');
  });

  test('should return 200 and upload the file if it has the same content as another file', async () => {
    db.createTable.mockResolvedValueOnce(); // CREATE TABLE IF NOT EXISTS
    db.getFileByHashAndName.mockResolvedValueOnce([]); // SELECT * FROM fileHashTable WHERE hash = $1 AND displayName = $2
    db.getFileByHash.mockResolvedValueOnce([{ filename: saveFileName }]); // SELECT * FROM fileHashTable WHERE hash = $1

    // Make a POST request to the /upload endpoint with the test file
    const res = await request(app)
      .post('/upload')
      .attach('sampleFile', Buffer.from('This is a test file'), 'test3.txt');
    
    // Check that the response status is 200 and the body contains the expected success message
    expect(res.status).toBe(200);
    expect(res.text).toBe('File uploaded!');

    // Check that the addFile function has been called with the expected arguments
    expect(db.addFile).toHaveBeenCalledWith(hashValue, saveFileName, 'test3.txt');
  });
});

describe('DELETE /file/:name', () => {
  const apiPath = '/file';
  const doesNotExistFileName = 'doesnotexist.txt';
  const displayFileName = 'test.txt';
  const virtualPath = 'data/uploads/';
  let hashValue = createHash(Buffer.from('This is a test file'));
  let saveFileName = hashValue.substring(0, 10) + '_' + displayFileName;
  beforeAll(() => {
    mockFs({
      data: {
        uploads: {
          [saveFileName]: 'This is a test file'
        }
      }
    });
  });

  afterAll(() => {
    // Restore the original file system
    mockFs.restore();
  });

  test('should return 404 if the file does not exist', async () => {
    // Mock the getFileByName function to simulate a non-existing file
    db.getFileByName.mockResolvedValueOnce([]);

    // Make a DELETE request to the /file/test endpoint
    const res = await request(app).delete(apiPath + '/' + doesNotExistFileName);

    // Check that the response status is 404 and the body contains the expected error message
    expect(res.status).toBe(404);
    expect(res.text).toBe('File not found!');
  });

  test('should return 200 and delete the file record in database only if it has many files with the same content', async () => {
    db.getFileByName.mockResolvedValueOnce([{ hash: hashValue, filename: saveFileName, displayFileName: displayFileName }]);
    db.getFileCountByHash.mockResolvedValueOnce(2);
    db.deleteFile.mockResolvedValueOnce();

    // Make a DELETE request to the /file/test endpoint
    const res = await request(app).delete(apiPath + '/' + displayFileName);

    // Check that the response status is 200 and the body contains the expected success message
    expect(res.status).toBe(200);
    expect(res.text).toBe('File deleted!');

    // Check that the deleteFile function has been called with the expected arguments
    expect(db.deleteFile).toHaveBeenCalledWith(saveFileName, displayFileName);

    // Check that the file still exists
    expect(fs.existsSync(virtualPath + saveFileName)).toBe(true);
  });

  test('should return 200 and delete the file both in database and storage', async () => {
    db.getFileByName.mockResolvedValueOnce([{ hash: hashValue, filename: saveFileName, displayFileName: displayFileName }]);
    db.getFileCountByHash.mockResolvedValueOnce(1);
    db.getFileByHash.mockResolvedValueOnce([{ filename: saveFileName }]);
    db.deleteFile.mockResolvedValueOnce();

    // Make a DELETE request to the /file/test endpoint
    const res = await request(app).delete(apiPath + '/' + displayFileName);

    // Check that the response status is 200 and the body contains the expected success message
    expect(res.status).toBe(200);
    expect(res.text).toBe('File deleted!');
    // Check that the file no longer exists
    expect(fs.existsSync(virtualPath + saveFileName)).toBe(false);
  });
});
