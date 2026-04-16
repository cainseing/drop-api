import App from "../app.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { IStoreRequest } from "../Requests/IStoreRequest.js";
import { randomBytes } from "node:crypto";

class StoreController {
    static async handle(request: FastifyRequest<IStoreRequest>, reply: FastifyReply): Promise<void> {
        const blob: string =  request.body?.blob;
        const reads: number = request.body?.reads ?? 1;
        const signature: string = request.body?.signature;
        const ttl: number = request.body?.ttl ?? App.config.DEFAULT_TTL;
        const sender: string = request.body?.sender;
        const provider: string = request.body?.provider;

        const id: string  = randomBytes(8).toString('hex');

        await App.redis.set(`blob:${id}`, blob, 'EX', ttl);
        await App.redis.set(`count:${id}`, reads, 'EX', ttl);
        await App.redis.set(`signature:${id}`, signature, 'EX', ttl);
        await App.redis.set(`sender:${id}`, sender, 'EX', ttl);
        await App.redis.set(`provider:${id}`, provider, 'EX', ttl);

        return reply.send({ id });
    }
}

export default StoreController;