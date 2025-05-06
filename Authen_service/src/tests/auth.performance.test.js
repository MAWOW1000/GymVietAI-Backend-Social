const jwt = require('jsonwebtoken');
const cacheUtils = require('../utils/cacheUtils');
const authService = require('../service/authService');
require('dotenv').config();

const generateTestToken = () => {
    return jwt.sign(
        { email: 'test@example.com' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
    );
};

const simulateRequest = (token) => ({
    cookies: {
        'access-token': token,
        'refresh-token': token
    },
    user: {}
});

const simulateResponse = () => ({
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    clearCookie: jest.fn()
});

const simulateNext = jest.fn();

const measureExecutionTime = async (fn) => {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6; // Convert to milliseconds
};

describe('Authentication Middleware Performance Tests', () => {
    let testToken;
    
    beforeEach(async () => {
        testToken = generateTestToken();
        // Clear Redis cache before each test
        await cacheUtils.del('token:' + testToken);
    });

    test('Performance comparison: with and without cache', async () => {
        const iterations = 100;
        const req = simulateRequest(testToken);
        const res = simulateResponse();
        
        // Test without cache
        console.log('Testing without cache...');
        const withoutCacheTimes = [];
        for (let i = 0; i < iterations; i++) {
            const time = await measureExecutionTime(async () => {
                const verifyResult = await authService.verifyToken(testToken, testToken);
                if (verifyResult.EC === 0) {
                    req.user.email = verifyResult.DT.email;
                }
            });
            withoutCacheTimes.push(time);
        }

        // Add to cache
        await cacheUtils.set('token:' + testToken, { email: 'test@example.com' });

        // Test with cache
        console.log('Testing with cache...');
        const withCacheTimes = [];
        for (let i = 0; i < iterations; i++) {
            const time = await measureExecutionTime(async () => {
                const cachedUser = await cacheUtils.get('token:' + testToken);
                if (cachedUser) {
                    req.user = cachedUser;
                } else {
                    const verifyResult = await authService.verifyToken(testToken, testToken);
                    if (verifyResult.EC === 0) {
                        req.user.email = verifyResult.DT.email;
                    }
                }
            });
            withCacheTimes.push(time);
        }

        // Calculate statistics
        const avgWithoutCache = withoutCacheTimes.reduce((a, b) => a + b, 0) / iterations;
        const avgWithCache = withCacheTimes.reduce((a, b) => a + b, 0) / iterations;
        const maxWithoutCache = Math.max(...withoutCacheTimes);
        const maxWithCache = Math.max(...withCacheTimes);
        const minWithoutCache = Math.min(...withoutCacheTimes);
        const minWithCache = Math.min(...withCacheTimes);

        console.log('\nPerformance Results:');
        console.log('Without Cache:');
        console.log(`  Average: ${avgWithoutCache.toFixed(2)}ms`);
        console.log(`  Min: ${minWithoutCache.toFixed(2)}ms`);
        console.log(`  Max: ${maxWithoutCache.toFixed(2)}ms`);
        
        console.log('\nWith Cache:');
        console.log(`  Average: ${avgWithCache.toFixed(2)}ms`);
        console.log(`  Min: ${minWithCache.toFixed(2)}ms`);
        console.log(`  Max: ${maxWithCache.toFixed(2)}ms`);
        
        console.log(`\nPerformance Improvement: ${((avgWithoutCache - avgWithCache) / avgWithoutCache * 100).toFixed(2)}%`);

        // Assertions
        expect(avgWithCache).toBeLessThan(avgWithoutCache);
    });
});
