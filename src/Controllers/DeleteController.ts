import App from "../app.js";
import ErrorReply from "../Replies/ErrorReply.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { IPurgeRequest } from "../Requests/IPurgeRequest.js";

class DeleteController {
    static async handle(request: FastifyRequest<IPurgeRequest>, reply: FastifyReply): Promise<void> {
        const id: string = request.params?.id;

        if (!id) {
            return reply.status(400).send(new ErrorReply(400, 'INVALID_REQUEST'));
        }

        const drop: any = await App.redis.call('JSON.GET', `drop:${id}`);

        if (!drop) {
            return reply.status(404).send();
        }

        await App.redis.del(`drop:${id}`);

        return reply.status(204).send();
    }
}

export default DeleteController;