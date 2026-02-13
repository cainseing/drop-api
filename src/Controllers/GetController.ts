import App from "../app.js";
import ErrorReply from "../Replies/ErrorReply.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { IGetRequest } from "../Requests/IGetRequest.js";

class GetController {
    static async handle(request: FastifyRequest<IGetRequest>, reply: FastifyReply): Promise<void> {
        const id: string = request.params?.id;

        if (!id) {
            return reply.status(400).send(new ErrorReply(400, 'INVALID_REQUEST'));
        }

        const remaining: number = await App.redis.decr(`count:${id}`);

        if (remaining < 0) {
            await App.redis.del(`blob:${id}`);
            await App.redis.del(`count:${id}`);

            return reply.status(404).send({ error: "NOT_FOUND" });
        }

        const blob: string|null = await App.redis.get(`blob:${id}`);

        if (!blob) {
            return reply.status(404).send(new ErrorReply(404, 'NOT_FOUND'));
        }

        if (remaining === 0) {
            await App.redis.del(`blob:${id}`);
            await App.redis.del(`count:${id}`);
        }

        return reply.send({ blob, remaining_reads: remaining });
    }
}

export default GetController;