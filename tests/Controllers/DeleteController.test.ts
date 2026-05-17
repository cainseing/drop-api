import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IPurgeRequest } from '../../src/Requests/IPurgeRequest.js';
import App from '../../src/app.js';
import DeleteController from '../../src/Controllers/DeleteController.js';

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

describe('DeleteController', () => {
    let mockRequest: Partial<FastifyRequest<IPurgeRequest>>;
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

    it('should delete existing drop and return 204', async () => {
        const dropData = {
            blob: 'test-blob-data',
            provider: 'test-provider',
            reads: 3,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        mockRedisCall.mockResolvedValueOnce(JSON.stringify(dropData)); // JSON.GET returns existing drop

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenCalledWith('JSON.GET', 'drop:test-id-123');
        expect(mockRedisDel).toHaveBeenCalledWith('drop:test-id-123');
        expect(mockReply.status).toHaveBeenCalledWith(204);
        expect(mockReply.send).toHaveBeenCalledWith();
    });

    it('should return 404 when drop does not exist', async () => {
        mockRedisCall.mockResolvedValueOnce(null);

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenCalledWith('JSON.GET', 'drop:test-id-123');
        expect(mockRedisDel).not.toHaveBeenCalled();
        expect(mockReply.status).toHaveBeenCalledWith(404);
        expect(mockReply.send).toHaveBeenCalledWith();
    });

    it('should return 400 error when id parameter is missing', async () => {
        mockRequest.params = { id: undefined as any };

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
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

    it('should use the correct key format', async () => {
        const dropData = {
            blob: 'test-blob',
            provider: 'test-provider',
            reads: 1,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockRedisCall.mockResolvedValueOnce(JSON.stringify(dropData));

        mockRequest.params!.id = 'custom-id-456';

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenCalledWith('JSON.GET', 'drop:custom-id-456');
        expect(mockRedisDel).toHaveBeenCalledWith('drop:custom-id-456');
    });

    it('should handle empty params object', async () => {
        mockRequest.params = {} as any;

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
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

    it('should check existence before deleting', async () => {
        const dropData = {
            blob: 'test-blob',
            provider: 'test-provider',
            reads: 5,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockRedisCall.mockResolvedValueOnce(JSON.stringify(dropData));

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisCall).toHaveBeenCalledTimes(1);
        expect(mockRedisDel).toHaveBeenCalledTimes(1);

        const callOrder = mockRedisCall.mock.invocationCallOrder[0];
        const delOrder = mockRedisDel.mock.invocationCallOrder[0];
        expect(callOrder).toBeLessThan(delOrder);
    });

    it('should return 204 even if del returns 0 (key already deleted)', async () => {
        const dropData = {
            blob: 'test-blob',
            provider: 'test-provider',
            reads: 1,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockRedisCall.mockResolvedValueOnce(JSON.stringify(dropData));
        mockRedisDel.mockResolvedValueOnce(0);

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
            mockReply as FastifyReply
        );

        expect(mockReply.status).toHaveBeenCalledWith(204);
        expect(mockReply.send).toHaveBeenCalledWith();
    });

    it('should handle falsy but not null/undefined drop data', async () => {
        mockRedisCall.mockResolvedValueOnce('{}');

        await DeleteController.handle(
            mockRequest as FastifyRequest<IPurgeRequest>,
            mockReply as FastifyReply
        );

        expect(mockRedisDel).toHaveBeenCalledWith('drop:test-id-123');
        expect(mockReply.status).toHaveBeenCalledWith(204);
    });
});
