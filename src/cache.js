const AWS = require('aws-sdk');
const Redis = require('ioredis');
const client = new AWS.SecretsManager();

async function getRedisClient() {
    let host;
    let port;
    if (process.env.NODE_ENV === 'local') {
        // Use environment variables for local development
        host = process.env.REDIS_HOST;
        port = process.env.REDIS_PORT;
    } else {
        // Use AWS Secrets Manager for other environments
        const data = await client.getSecretValue({ SecretId: 'redis-credentials' }).promise();
        const secret = JSON.parse(data.SecretString);
        host = secret.redis_host;
        port = secret.redis_port;
    }
    const redis = new Redis({
        host: host,
        port: port
    });
    return redis;
}

async function cacheSet(key, value) {
    const redis = await getRedisClient();
    return await redis.set(key, value);
}

async function cacheGetBuffer(key) {
    const redis = await getRedisClient();
    return await redis.getBuffer(key);
}

async function cacheDel(key) {
    const redis = await getRedisClient();
    return await redis.del(key);
}

module.exports = {
    cacheSet,
    cacheGetBuffer,
    cacheDel
}
