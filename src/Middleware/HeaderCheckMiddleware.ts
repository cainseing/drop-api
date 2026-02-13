import * as ReplyHelpers from "../Helpers/ReplyHelpers.js";
import { FastifyRequest, FastifyReply } from "fastify";

export default class HeaderCheckMiddleware {
    public static handle(request: FastifyRequest, reply: FastifyReply, done: Function): void {
        const clientHeader: any = request.headers['x-drop-client'];
        const userAgent: any = request.headers['user-agent'];

        if (!clientHeader || !userAgent) {
            return ReplyHelpers.error(reply, 403, 'Unauthorized');
        }

        if (!['drop-cli-v1'].includes(clientHeader) || !['DropCLI/v1.0'].includes(userAgent)) {
            return ReplyHelpers.error(reply, 403, 'Unauthorized');
        }

        done();
    }
}