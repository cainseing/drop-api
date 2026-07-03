import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';

vi.mock('../../src/Helpers/ReplyHelpers.js', () => ({
  error: vi.fn(),
}));

import HeaderCheckMiddleware from '../../src/Middleware/HeaderCheckMiddleware.js';
import * as ReplyHelpers from '../../src/Helpers/ReplyHelpers.js';

describe('HeaderCheckMiddleware', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let mockDone: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRequest = {
            headers: {},
        };

        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };

        mockDone = vi.fn();
    });

    it('should pass validation with valid headers', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-cli-v1',
            'user-agent': 'DropCLI/v1.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should pass validation for web client', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-web-v1',
            'user-agent': 'Mozilla/5.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should reject missing user-agent header', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-cli-v1',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 403, 'Unauthorized');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should reject missing both headers', () => {
        mockRequest.headers = {};

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 403, 'Unauthorized');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should reject invalid x-drop-client header', () => {
        mockRequest.headers = {
            'x-drop-client': 'invalid-client',
            'user-agent': 'DropCLI/v1.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 403, 'Unauthorized');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept any non-empty user-agent value', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-cli-v1',
            'user-agent': 'Invalid-Agent/1.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should reject lowercase x-drop-client header', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-cli-v1.0',
            'user-agent': 'DropCLI/v1.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 403, 'Unauthorized');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept different user-agent version', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-cli-v1',
            'user-agent': 'DropCLI/2.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });

    it('should reject empty string headers', () => {
        mockRequest.headers = {
            'x-drop-client': '',
            'user-agent': '',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(ReplyHelpers.error).toHaveBeenCalledWith(mockReply, 403, 'Unauthorized');
        expect(mockDone).not.toHaveBeenCalled();
    });

    it('should accept exact client header value match', () => {
        mockRequest.headers = {
            'x-drop-client': 'drop-cli-v1',
            'user-agent': 'DropCLI/v1.0',
        };

        HeaderCheckMiddleware.handle(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply,
            mockDone
        );

        expect(mockDone).toHaveBeenCalled();
        expect(ReplyHelpers.error).not.toHaveBeenCalled();
    });
});