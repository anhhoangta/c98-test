const AWS = require('aws-sdk');
const { Pool } = require('pg');

let pool;

async function getPool() {
  if (!pool) {
    let dbConfig;
    if (process.env.NODE_ENV === 'local') {
      // Use environment variables for local development
      dbConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      };
    } else {
      // Use AWS Secrets Manager for other environments
      const client = new AWS.SecretsManager();
      const data = await client.getSecretValue({ SecretId: 'db-credentials' }).promise();
      const secret = JSON.parse(data.SecretString);
      dbConfig = {
        host: secret.db_host,
        port: secret.db_port,
        user: secret.db_username,
        password: secret.db_password,
        database: secret.db_name
      };
    }
    console.log(dbConfig);
    pool = new Pool(dbConfig);
  }
  return pool;
}

async function createTable() {
  // Get a database connection
  const pool = await getPool();

  // Create a table to store the hash table data
  await pool.query('CREATE TABLE IF NOT EXISTS fileHashTable (hash TEXT, fileName TEXT, displayName TEXT)');
}

async function getFileByName(displayName) {
  const pool = await getPool();
  let result = await pool.query('SELECT * FROM fileHashTable WHERE displayName = $1', [displayName]);
  return result.rows;
}

async function getFileByHashAndName(hash, displayName) {
  const pool = await getPool();

  let result = await pool.query('SELECT * FROM fileHashTable WHERE hash = $1 AND displayName = $2', [hash, displayName]);
  return result.rows;
}

async function getFileByHash(hash) {
  const pool = await getPool();

  let result = await pool.query('SELECT * FROM fileHashTable WHERE hash = $1', [hash]);
  return result.rows;
}

async function getFileCountByHash(hash) {
  const pool = await getPool();

  let result = await pool.query('SELECT COUNT(*) as Total FROM fileHashTable WHERE hash = $1', [hash]);
  return result.rows[0].total;
}

async function deleteFile(fileName, displayName) {
  const pool = await getPool();

  await pool.query('DELETE FROM fileHashTable WHERE fileName = $1 AND displayName = $2', [fileName, displayName]);
}

async function addFile(hash, fileName, displayName) {
  const pool = await getPool();

  await pool.query('INSERT INTO fileHashTable (hash, fileName, displayName) VALUES ($1, $2, $3)', [hash, fileName, displayName]);
}

module.exports = {
  createTable,
  getFileByName,
  getFileByHashAndName,
  getFileByHash,
  getFileCountByHash,
  addFile,
  deleteFile
};
