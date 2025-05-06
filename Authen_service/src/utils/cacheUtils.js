const redisClient = require('../config/redis');

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

const cacheUtils = {
    async get(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache Get Error:', error);
            return null;
        }
    },

    async set(key, value, expiration = DEFAULT_EXPIRATION) {
        try {
            const stringValue = JSON.stringify(value);
            await redisClient.setex(key, expiration, stringValue);
            return true;
        } catch (error) {
            console.error('Cache Set Error:', error);
            return false;
        }
    },

    async del(key) {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error('Cache Delete Error:', error);
            return false;
        }
    },

    generateKey(...args) {
        return args.join(':');
    },

    async getAllKeys() {
        try {
            const keys = await redisClient.keys('*');
            const result = {};
            
            for (const key of keys) {
                const value = await redisClient.get(key);
                const ttl = await redisClient.ttl(key);
                result[key] = {
                    value: JSON.parse(value),
                    ttl: ttl
                };
            }
            
            return result;
        } catch (error) {
            console.error('Cache Inspection Error:', error);
            return null;
        }
    },

    async getKeyInfo(key) {
        try {
            const value = await redisClient.get(key);
            const ttl = await redisClient.ttl(key);
            return {
                value: value ? JSON.parse(value) : null,
                ttl: ttl
            };
        } catch (error) {
            console.error('Cache Key Inspection Error:', error);
            return null;
        }
    }
};

module.exports = cacheUtils;
