const AWS = require('aws-sdk');
const { Client } = require('pg');

let dbClient;

async function getDbClient() {
  if (!dbClient) {
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
    dbClient = new Client(dbConfig);
    await dbClient.connect();
  }
  return dbClient;
}

module.exports = { getDbClient };
