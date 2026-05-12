import App from "../app.js";
import Drop from "../DTO/Drop.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { IStoreRequest } from "../Requests/IStoreRequest.js";
import { randomBytes, sign } from "node:crypto";

class StoreController {
    static async handle(request: FastifyRequest<IStoreRequest>, reply: FastifyReply): Promise<void> {
        const blob: string =  request.body?.blob;
        const reads: number = request.body?.reads ?? 1;
        const signature: string = request.body?.signature;
        const ttl: number = request.body?.ttl ?? App.config.DEFAULT_TTL;
        const sender: string = request.body?.sender;
        const provider: string = request.body?.provider;

        const id: string  = randomBytes(8).toString('hex');

        const drop: Drop = new Drop(blob, provider, reads, sender, signature, ttl);

        await App.redis.call('JSON.SET', `drop:${id}`, '$', JSON.stringify(drop), 'NX');
        await App.redis.expire(`drop:${id}`, ttl);

        return reply.send({ id });
    }
}

export default StoreController;