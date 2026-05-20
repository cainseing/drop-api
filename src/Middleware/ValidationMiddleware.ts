import * as ReplyHelpers from "../Helpers/ReplyHelpers.js";
import App from "../app.js";
import { FastifyRequest, FastifyReply } from "fastify";
import { IStoreRequest } from "../Requests/IStoreRequest.js";
import { getEntropyScore } from "../Helpers/Entropy.js";

const KNOWN_PROVIDERS = ['github', 'gitlab'];
const MAX_FIELD_LENGTH = 255;

export default class ValidationMiddleware {
    public static handle(request: FastifyRequest<IStoreRequest>, reply: FastifyReply, done: Function): void {
        const blob: string = request.body?.blob;
        const ttl: number = request.body?.ttl;
        const reads: number = request.body?.reads;
        const sender: string = request.body?.sender;
        const provider: string = request.body?.provider;
        const signature: string = request.body?.signature;

        if (ttl !== undefined && ttl > App.config.MAX_TTL) {
            return ReplyHelpers.error(reply, 422, 'TTL_TOO_LONG');
        }
        if (ttl !== undefined && ttl < 30) {
            return ReplyHelpers.error(reply, 422, 'TTL_TOO_SHORT');
        }

        if (reads !== undefined) {
            if (!Number.isInteger(reads) || reads < 1 || reads > 100) {
                return ReplyHelpers.error(reply, 422, 'INVALID_READS');
            }
        }

        if (sender && sender.length > MAX_FIELD_LENGTH) {
            return ReplyHelpers.error(reply, 422, 'SENDER_TOO_LONG');
        }
        if (signature && signature.length > MAX_FIELD_LENGTH) {
            return ReplyHelpers.error(reply, 422, 'SIGNATURE_TOO_LONG');
        }
        if (provider && !KNOWN_PROVIDERS.includes(provider)) {
            return ReplyHelpers.error(reply, 422, 'INVALID_PROVIDER');
        }

        const buffer: Buffer<ArrayBuffer> = Buffer.from(blob, 'base64');

        // Must be a base64 encoded encrypted string
        if (buffer.toString('base64') !== blob) {
            return ReplyHelpers.error(reply, 422, 'INVALID_ENCODING');
        }

        // Size checks
        if (buffer.length < 128) {
            return ReplyHelpers.error(reply, 422, 'BLOB_TOO_SMALL');
        }
        if (buffer.length > (App.config.MAX_SIZE * 1024 * 1024)) {
            return ReplyHelpers.error(reply, 413, 'BLOB_TOO_LARGE');
        }

        // Entropy check
        const score: number = getEntropyScore(buffer);

        // Encrypted data is almost always > 7.5
        if (score < App.config.MIN_ENTROPY_SCORE) {
            return ReplyHelpers.error(reply, 422, 'UNENCRYPTED_BLOB_DETECTED');
        }

        done();
    }
}