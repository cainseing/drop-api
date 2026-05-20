import { describe, it, expect, vi } from 'vitest';
import { registerCommands } from '../../src/Helpers/RedisCommands.js';

describe('registerCommands', () => {
    const makeRedis = () => ({ defineCommand: vi.fn() });

    it('registers the getAndDecrement command', () => {
        const redis = makeRedis();
        registerCommands(redis);
        expect(redis.defineCommand).toHaveBeenCalledOnce();
        expect(redis.defineCommand).toHaveBeenCalledWith('getAndDecrement', expect.objectContaining({
            numberOfKeys: 1,
            lua: expect.any(String),
        }));
    });

    it('uses numberOfKeys: 1 so the first argument is treated as a Redis key', () => {
        const redis = makeRedis();
        registerCommands(redis);
        const [, options] = redis.defineCommand.mock.calls[0];
        expect(options.numberOfKeys).toBe(1);
    });

    it('includes a non-empty lua script', () => {
        const redis = makeRedis();
        registerCommands(redis);
        const [, options] = redis.defineCommand.mock.calls[0];
        expect(options.lua.trim().length).toBeGreaterThan(0);
    });
});
