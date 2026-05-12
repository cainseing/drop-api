import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IStoreRequest } from '../../Requests/IStoreRequest.js';

vi.mock('../../app.js', () => ({
  default: {
    config: {
      DEFAULT_TTL: 3600,
    },
    redis: {
      call: vi.fn().mockResolvedValue('OK'),
      expire: vi.fn().mockResolvedValue(1),
    },
  },
}));

import StoreController from '../StoreController.js';
import App from '../../app.js';

describe('StoreController', () => {
    let mockRequest: Partial<FastifyRequest<IStoreRequest>>;
    let mockReply: Partial<FastifyReply>;
    let mockRedisCall: vi.Mock;
    let mockRedisExpire: vi.Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRedisCall = (App as any).redis.call;
        mockRedisExpire = (App as any).redis.expire;

        mockRequest = {
            body: {
                blob: 'test-blob-data',
                provider: 'test-provider',
                reads: 5,
                sender: 'test-sender',
                signature: 'test-signature',
                ttl: 7200,
            },
        };

        mockReply = {
            send: vi.fn().mockReturnValue(mockReply),
        };
    });

    it('should store a drop with all provided fields', async () => {
        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenCalledWith(
            'JSON.SET',
            expect.stringMatching(/^drop:[a-f0-9]{16}$/),
            '$',
            expect.stringContaining('"blob":"test-blob-data"'),
            'NX'
        );

        expect(mockRedisExpire).toHaveBeenCalledWith(
            expect.stringMatching(/^drop:[a-f0-9]{16}$/),
            7200
        );

        expect(mockReply.send).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.stringMatching(/^[a-f0-9]{16}$/),
            })
        );
    });

    it('should use default reads value when not provided', async () => {
        mockRequest.body = {
            ...mockRequest.body,
            reads: undefined as any,
        };

        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        const callArgs = mockRedisCall.mock.calls[0];
        const storedData = JSON.parse(callArgs[3]);

        expect(storedData.reads).toBe(1);
    });

    it('should use default ttl value when not provided', async () => {
        mockRequest.body = {
            ...mockRequest.body,
            ttl: undefined as any,
        };

        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisExpire).toHaveBeenCalledWith(
            expect.stringMatching(/^drop:[a-f0-9]{16}$/),
            3600
        );
    });

    it('should create a Drop instance with correct data', async () => {
        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        const callArgs = mockRedisCall.mock.calls[0];
        const storedDataStr = callArgs[3];
        const storedData = JSON.parse(storedDataStr);

        expect(storedData).toMatchObject({
            blob: 'test-blob-data',
            provider: 'test-provider',
            reads: 5,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        });
    });

    it('should use NX flag to prevent overwriting existing drops', async () => {
        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        const callArgs = mockRedisCall.mock.calls[0];
        expect(callArgs[4]).toBe('NX');
    });

    it('should generate a unique 16-character hex ID', async () => {
        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        const firstCallId = (mockReply.send as any).mock.calls[0][0].id;

        vi.clearAllMocks();
        (App as any).redis = {
            call: mockRedisCall,
            expire: mockRedisExpire,
        };

        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        const secondCallId = (mockReply.send as any).mock.calls[0][0].id;

        expect(firstCallId).toMatch(/^[a-f0-9]{16}$/);
        expect(secondCallId).toMatch(/^[a-f0-9]{16}$/);
        expect(firstCallId).not.toBe(secondCallId);
    });

    it('should use the same key for both JSON.SET and expire', async () => {
        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        const jsonSetKey = mockRedisCall.mock.calls[0][1];
        const expireKey = mockRedisExpire.mock.calls[0][0];

        expect(jsonSetKey).toBe(expireKey);
    });

    it('should handle minimal request body with only required blob', async () => {
        mockRequest.body = {
            blob: 'minimal-blob',
            provider: undefined as any,
            reads: undefined as any,
            sender: undefined as any,
            signature: undefined as any,
            ttl: undefined as any,
        };

        await StoreController.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenCalled();
        expect(mockReply.send).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.stringMatching(/^[a-f0-9]{16}$/),
            })
        );
    });
});
