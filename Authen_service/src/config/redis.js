const Redis = require('ioredis');
const mockRedisClient = require('./mockRedis');

// Kiểm tra biến môi trường để quyết định có sử dụng Redis hay không
const USE_REDIS = process.env.USE_REDIS === 'true';

let redisClient;

if (USE_REDIS) {
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || '',
            // Thêm timeout ngắn để tránh chờ quá lâu khi không có Redis
            connectTimeout: 1000,
            maxRetriesPerRequest: 1
        });

        redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error, falling back to MockRedis:', err);
            // Chuyển sang MockRedis nếu có lỗi
            redisClient = mockRedisClient;
        });
    } catch (error) {
        console.error('Failed to initialize Redis, using MockRedis instead:', error);
        redisClient = mockRedisClient;
    }
} else {
    console.log('Redis disabled via environment settings, using MockRedis');
    redisClient = mockRedisClient;
}

module.exports = redisClient;
