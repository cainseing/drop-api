import DeleteController from "./src/Controllers/DeleteController.js";
import GetController from "./src/Controllers/GetController.js";
import HeaderCheckMiddleware from "./src/Middleware/HeaderCheckMiddleware.js"
import StoreController from "./src/Controllers/StoreController.js";
import ValidationMiddlware from "./src/Middleware/ValidationMiddleware.js";
import { FastifyInstance } from 'fastify';

async function routes(fastify: FastifyInstance, options: any): Promise<void> {
    fastify.route({
        handler: DeleteController.handle,
        onRequest: HeaderCheckMiddleware.handle,
        method: 'DELETE',
        url: '/blob/:id',
    });

    fastify.route({
        handler: GetController.handle,
        onRequest: HeaderCheckMiddleware.handle,
        method: 'GET',
        url: '/blob/:id',
    });

    fastify.route({
        bodyLimit: (fastify.config.MAX_SIZE + 1) * 1024 * 1024,
        handler: StoreController.handle,
        onRequest: HeaderCheckMiddleware.handle,
        preValidation: ValidationMiddlware.handle,
        method: 'POST',
        url: '/blob',
    });
}

export default routes;