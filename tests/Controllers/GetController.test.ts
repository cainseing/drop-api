import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IGetRequest } from '../../src/Requests/IGetRequest.js';

vi.mock('../../src/app.js', () => ({
  default: {
    config: {
      DEFAULT_TTL: 3600,
    },
    redis: {
      getAndDecrement: vi.fn(),
    },
  },
}));

import GetController from '../../src/Controllers/GetController.js';
import App from '../../src/app.js';

describe('GetController', () => {
    let mockRequest: Partial<FastifyRequest<IGetRequest>>;
    let mockReply: Partial<FastifyReply>;
    let mockGetAndDecrement: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGetAndDecrement = (App as any).redis.getAndDecrement;

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
            provider: 'github',
            reads: 3,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        mockGetAndDecrement.mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockGetAndDecrement).toHaveBeenCalledWith('drop:test-id-123');

        expect(mockReply.send).toHaveBeenCalledWith({
            blob: 'test-blob-data',
            remaining_reads: 3,
            signature: 'test-signature',
            sender: 'test-sender',
            provider: 'github',
        });
    });

    it('should return drop data and let Lua handle deletion when reads reach 0', async () => {
        const dropData = {
            blob: 'test-blob-data',
            provider: 'github',
            reads: 0,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        mockGetAndDecrement.mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockGetAndDecrement).toHaveBeenCalledWith('drop:test-id-123');
        expect(mockReply.send).toHaveBeenCalledWith({
            blob: 'test-blob-data',
            remaining_reads: 0,
            signature: 'test-signature',
            sender: 'test-sender',
            provider: 'github',
        });
    });

    it('should return 404 when reads are already exhausted (Lua returns null)', async () => {
        mockGetAndDecrement.mockResolvedValueOnce(null);

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockGetAndDecrement).toHaveBeenCalledWith('drop:test-id-123');
        expect(mockReply.status).toHaveBeenCalledWith(404);
        const sentError = (mockReply.send as any).mock.calls[0][0];
        expect(sentError.toJSON()).toMatchObject({
            code: 404,
            message: 'NOT_FOUND',
        });
    });

    it('should return 400 error when id parameter is missing', async () => {
        mockRequest.params = { id: undefined as any };

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockGetAndDecrement).not.toHaveBeenCalled();

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
        mockGetAndDecrement.mockResolvedValueOnce(null);

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

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
            provider: 'github',
            reads: 1,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockGetAndDecrement.mockResolvedValueOnce(JSON.stringify(dropData));

        mockRequest.params!.id = 'custom-id-456';

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockGetAndDecrement).toHaveBeenCalledWith('drop:custom-id-456');
    });

    it('should return the reads value from the Lua result', async () => {
        const dropData = {
            blob: 'test-blob',
            provider: 'github',
            reads: 5,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 3600,
        };

        mockGetAndDecrement.mockResolvedValueOnce(JSON.stringify(dropData));

        await GetController.handle(
            mockRequest as FastifyRequest<IGetRequest>,
            mockReply as FastifyReply
        );

        expect(mockGetAndDecrement).toHaveBeenCalledWith('drop:test-id-123');

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
