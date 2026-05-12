import App from "../app.js";
import Drop from "../DTO/Drop.js";
import ErrorReply from "../Replies/ErrorReply.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { IGetRequest } from "../Requests/IGetRequest.js";

class GetController {
    static async handle(request: FastifyRequest<IGetRequest>, reply: FastifyReply): Promise<void> {
        const id: string = request.params?.id;

        if (!id) {
            return reply.status(400).send(new ErrorReply(400, 'INVALID_REQUEST'));
        }

        await App.redis.call('JSON.NUMINCRBY', `drop:${id}`, '$.reads', -1);

        const data: any = await App.redis.call('JSON.GET', `drop:${id}`);

        if (!data) {
            return reply.status(404).send(new ErrorReply(404, 'NOT_FOUND'));
        }

        const drop: Drop = Drop.fromJSON(JSON.parse(data));

        if (drop.reads < 0) {
            await App.redis.del(`drop:${id}`);
            return reply.status(404).send({ error: "NOT_FOUND" });
        }

        if (drop.reads === 0) {
            await App.redis.del(`drop:${id}`);
        }

        return reply.send({ 
            blob: drop.blob,
            remaining_reads: drop.reads, 
            signature: drop.signature,
            sender: drop.sender,
            provider: drop.provider
        });
    }
}

export default GetController;