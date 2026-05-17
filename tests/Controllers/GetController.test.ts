import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IGetRequest } from '../../src/Requests/IGetRequest.js';

vi.mock('../../src/app.js', () => ({
  default: {
    config: {
      DEFAULT_TTL: 3600,
    },
    redis: {
      call: vi.fn(),
      del: vi.fn().mockResolvedValue(1),
    },
  },
}));

import GetController from '../../src/Controllers/GetController.js';
import App from '../../src/app.js';

describe('GetController', () => {
    let mockRequest: Partial<FastifyRequest<IGetRequest>>;
    let mockReply: Partial<FastifyReply>;
    let mockRedisCall: Mock;
    let mockRedisDel: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRedisCall = (App as any).redis.call;
        mockRedisDel = (App as any).redis.del;

        mockRequest = {
            params: {
                id: 'test-id-123',
            },
        };

        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
    });

    it('should return drop data when reads > 0', async () => {
        const dropData = {
            blob: 'test-blob-data',
            provider: 'test-provider',
            reads: 3,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        mockRedisCall
            .mockResolvedValueOnce('OK')
            .mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenNthCalledWith(
            1,
            'JSON.NUMINCRBY',
            'drop:test-id-123',
            '$.reads',
            -1
        );

        expect(mockRedisCall).toHaveBeenNthCalledWith(
            2,
            'JSON.GET',
            'drop:test-id-123'
        );

        expect(mockReply.send).toHaveBeenCalledWith({
            blob: 'test-blob-data',
            remaining_reads: 3,
            signature: 'test-signature',
            sender: 'test-sender',
            provider: 'test-provider',
        });

        expect(mockRedisDel).not.toHaveBeenCalled();
    });

    it('should delete drop when reads reach 0', async () => {
        const dropData = {
            blob: 'test-blob-data',
            provider: 'test-provider',
            reads: 0,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        mockRedisCall
            .mockResolvedValueOnce('OK')
            .mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisDel).toHaveBeenCalledWith('drop:test-id-123');
        expect(mockReply.send).toHaveBeenCalledWith({
            blob: 'test-blob-data',
            remaining_reads: 0,
            signature: 'test-signature',
            sender: 'test-sender',
            provider: 'test-provider',
        });
    });

    it('should delete drop when reads go below 0', async () => {
        const dropData = {
            blob: 'test-blob-data',
            provider: 'test-provider',
            reads: -1,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        mockRedisCall
            .mockResolvedValueOnce('OK')
            .mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisDel).toHaveBeenCalledWith('drop:test-id-123');
        expect(mockReply.status).toHaveBeenCalledWith(404);
        expect(mockReply.send).toHaveBeenCalledWith({ error: "NOT_FOUND" });
    });

    it('should return 400 error when id parameter is missing', async () => {
        mockRequest.params = { id: undefined as any };

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).not.toHaveBeenCalled();
        expect(mockRedisDel).not.toHaveBeenCalled();

        expect(mockReply.status).toHaveBeenCalledWith(400);
        const sentError = (mockReply.send as any).mock.calls[0][0];
        expect(sentError.toJSON()).toMatchObject({
            code: 400,
            message: 'INVALID_REQUEST',
        });
        expect(sentError.toJSON()).toHaveProperty('timestamp');
        expect(typeof sentError.toJSON().timestamp).toBe('number');
    });

    it('should return 404 error when drop does not exist', async () => {
        mockRedisCall
            .mockResolvedValueOnce('OK')
            .mockResolvedValueOnce(null);

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisDel).not.toHaveBeenCalled();

        expect(mockReply.status).toHaveBeenCalledWith(404);
        const sentError = (mockReply.send as any).mock.calls[0][0];
        expect(sentError.toJSON()).toMatchObject({
            code: 404,
            message: 'NOT_FOUND',
        });
        expect(sentError.toJSON()).toHaveProperty('timestamp');
        expect(typeof sentError.toJSON().timestamp).toBe('number');
    });

    it('should use the correct key format', async () => {
        const dropData = {
            blob: 'test-blob',
            provider: 'test-provider',
            reads: 1,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockRedisCall
            .mockResolvedValueOnce('OK')
            .mockResolvedValueOnce(JSON.stringify(dropData));

        mockRequest.params!.id = 'custom-id-456';

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenNthCalledWith(
            1,
            'JSON.NUMINCRBY',
            'drop:custom-id-456',
            '$.reads',
            -1
        );

        expect(mockRedisCall).toHaveBeenNthCalledWith(
            2,
            'JSON.GET',
            'drop:custom-id-456'
        );
    });

    it('should decrement reads by exactly 1', async () => {
        const dropData = {
            blob: 'test-blob',
            provider: 'test-provider',
            reads: 5,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockRedisCall
            .mockResolvedValueOnce('OK')
            .mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenNthCalledWith(
            1,
            'JSON.NUMINCRBY',
            'drop:test-id-123',
            '$.reads',
            -1
        );

        expect(mockReply.send).toHaveBeenCalledWith(
            expect.objectContaining({
                remaining_reads: 5,
            })
        );
    });

    it('should handle empty params object', async () => {
        mockRequest.params = {} as any;

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockReply.status).toHaveBeenCalledWith(400);
        const sentError = (mockReply.send as any).mock.calls[0][0];
        expect(sentError.toJSON()).toMatchObject({
            code: 400,
            message: 'INVALID_REQUEST',
        });
        expect(sentError.toJSON()).toHaveProperty('timestamp');
        expect(typeof sentError.toJSON().timestamp).toBe('number');
    });
});
