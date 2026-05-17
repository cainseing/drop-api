import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IStoreRequest } from '../../src/Requests/IStoreRequest.js';

vi.mock('../../src/app.js', () => ({
  default: {
    config: {
      MAX_TTL: 10080, // 1 week
      MAX_SIZE: 1, // 1 MB
      MIN_ENTROPY_SCORE: 6.5,
    },
  },
}));

vi.mock('../../src/Helpers/ReplyHelpers.js', () => ({
  error: vi.fn(),
}));

import ValidationMiddleware from '../../src/Middleware/ValidationMiddleware.js';
import * as ReplyHelpers from '../../src/Helpers/ReplyHelpers.js';

describe('ValidationMiddleware', () => {
    let mockRequest: Partial<FastifyRequest<IStoreRequest>>;
    let mockReply: Partial<FastifyReply>;
    let mockDone: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRequest = {
            body: {
                blob: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
                provider: 'test-provider',
                reads: 5,
                sender: 'test-sender',
                signature: 'test-signature',
                ttl: 3600,
            },
        };

        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };

        mockDone = vi.fn();
    });

    it('should pass validation for valid request', () => {
        const highEntropyData = Buffer.from(Array.from({ length: 256 }, () => Math.floor(Math.random() * 256)));
        mockRequest.body!.blob = highEntropyData.toString('base64');

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should reject TTL that is too long', () => {
        mockRequest.body!.ttl = 20000;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 422, 'TTL_TOO_LONG');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should reject TTL that is too short', () => {
        mockRequest.body!.ttl = 10;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 422, 'TTL_TOO_SHORT');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept valid TTL values', () => {
        const highEntropyData = Buffer.from(Array.from({ length: 256 }, () => Math.floor(Math.random() * 256)));
        mockRequest.body!.blob = highEntropyData.toString('base64');

        const validTTLs = [30, 3600, 10080];

        for (const ttl of validTTLs) {
            vi.clearAllMocks();
            mockRequest.body!.ttl = ttl;

            ValidationMiddleware.handle(
                mockRequest as FastifyRequest<IStoreRequest>,
                mockReply as FastifyReply,
                mockDone
            );

            expect(mockDone).toHaveBeenCalled();
            expect(ReplyHelpers.error).not.toHaveBeenCalled();
        }
    });

    it('should reject invalid base64 encoding', () => {
        mockRequest.body!.blob = 'invalid-base64!@#';

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 422, 'INVALID_ENCODING');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept valid base64 encoding', () => {
        const highEntropyData = Buffer.from(Array.from({ length: 256 }, () => Math.floor(Math.random() * 256)));
        mockRequest.body!.blob = highEntropyData.toString('base64');

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should reject blob that is too small', () => {
        const smallBlob = Buffer.from('short').toString('base64');
        mockRequest.body!.blob = smallBlob;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 422, 'BLOB_TOO_SMALL');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should reject blob that is too large', () => {
        const largeBlob = Buffer.alloc(1024 * 1024 + 1).toString('base64');
        mockRequest.body!.blob = largeBlob;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 413, 'BLOB_TOO_LARGE');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept blob of valid size', () => {
        const validData = Buffer.from(Array.from({ length: 1024 }, () => Math.floor(Math.random() * 256)));
        const validBlob = validData.toString('base64');
        mockRequest.body!.blob = validBlob;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should reject blob with insufficient entropy', () => {
        const lowEntropyBlob = Buffer.from('A'.repeat(256)).toString('base64');
        mockRequest.body!.blob = lowEntropyBlob;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 422, 'UNENCRYPTED_BLOB_DETECTED');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept blob with sufficient entropy', () => {
        const highEntropyData = Buffer.from(Array.from({ length: 256 }, () => Math.floor(Math.random() * 256)));
        mockRequest.body!.blob = highEntropyData.toString('base64');

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should handle missing blob field', () => {
        mockRequest.body = {
            blob: undefined as any,
            provider: 'test-provider',
            reads: 5,
            sender: 'test-sender',
            signature: 'test-signature',
            ttl: 7200,
        };

        expect(() => {
            ValidationMiddleware.handle(
                mockRequest as FastifyRequest<IStoreRequest>,
                mockReply as FastifyReply,
                mockDone
            );
        }).toThrow();

        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should handle empty blob string', () => {
        mockRequest.body!.blob = '';

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 422, 'BLOB_TOO_SMALL');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should validate maximum blob size exactly', () => {
        const maxBinarySize = 1024 * 1024; // 1MB
        const maxData = Buffer.from(Array.from({ length: Math.floor(maxBinarySize * 0.75) }, () => Math.floor(Math.random() * 256)));
        const maxSizeBlob = maxData.toString('base64');
        mockRequest.body!.blob = maxSizeBlob;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should handle entropy score at minimum threshold', () => {
        const mockEntropy = vi.fn().mockReturnValue(6.5);

        vi.doMock('../../Helpers/Entropy.js', () => ({
            getEntropyScore: mockEntropy,
        }));

        const validData = Buffer.from(Array.from({ length: 256 }, () => Math.floor(Math.random() * 256)));
        const validBlob = validData.toString('base64');
        mockRequest.body!.blob = validBlob;

        ValidationMiddleware.handle(
            mockRequest as FastifyRequest<IStoreRequest>,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });
});
