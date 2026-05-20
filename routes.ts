import DeleteController from "./src/Controllers/DeleteController.js";
import GetController from "./src/Controllers/GetController.js";
import HeaderCheckMiddleware from "./src/Middleware/HeaderCheckMiddleware.js"
import StoreController from "./src/Controllers/StoreController.js";
import ValidationMiddleware from "./src/Middleware/ValidationMiddleware.js";
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
        preValidation: ValidationMiddleware.handle,
        method: 'POST',
        url: '/blob',
    });

    fastify.route({
        handler: async (request, reply) => {
            try {
                await fastify.redis.ping();
                return reply.status(200).send({
                    message: 'Zero-knowledge vault is operational',
                    timestamp: new Date().toISOString()
                });
            } catch {
                return reply.status(503).send({
                    message: 'Service unavailable',
                    timestamp: new Date().toISOString()
                });
            }
        },
        method: 'GET',
        url: '/health',
    });
}

export default routes;