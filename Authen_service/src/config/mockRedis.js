// Mock Redis client để sử dụng khi không có Redis server
class MockRedis {
    constructor() {
        this.store = new Map();
        this.ttlStore = new Map();
        console.log('Using MockRedis instead of Redis');
    }

    async get(key) {
        // Kiểm tra nếu key đã hết hạn
        if (this.ttlStore.has(key)) {
            const expireTime = this.ttlStore.get(key);
            if (expireTime < Date.now()) {
                // Key đã hết hạn, xóa và trả về null
                this.store.delete(key);
                this.ttlStore.delete(key);
                return null;
            }
        }
        return this.store.get(key) || null;
    }

    async setex(key, seconds, value) {
        this.store.set(key, value);
        // Tính thời gian hết hạn
        const expireTime = Date.now() + (seconds * 1000);
        this.ttlStore.set(key, expireTime);
        return 'OK';
    }

    async set(key, value) {
        this.store.set(key, value);
        return 'OK';
    }

    async del(key) {
        this.store.delete(key);
        this.ttlStore.delete(key);
        return 1;
    }

    async ttl(key) {
        if (!this.ttlStore.has(key)) return -1;
        const expireTime = this.ttlStore.get(key);
        const ttl = Math.floor((expireTime - Date.now()) / 1000);
        return ttl > 0 ? ttl : -2;
    }

    async keys(pattern) {
        if (pattern === '*') {
            return Array.from(this.store.keys());
        }
        // Simple pattern matching (only supports *)
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return Array.from(this.store.keys()).filter(key => regex.test(key));
    }

    // Emulate Redis events
    on(event, callback) {
        if (event === 'connect') {
            // Call the connect callback immediately
            setTimeout(callback, 0);
        }
        return this;
    }
}

const mockRedisClient = new MockRedis();

module.exports = mockRedisClient; 