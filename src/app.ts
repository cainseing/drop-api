import Handler from './Errors/Handler.js';
import Redis from '@fastify/redis';
import config from './Schemas/config.js';
import cors from '@fastify/cors';
import fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import routes from '../routes.js';

const app: fastify.FastifyInstance = fastify({ logger: true });

app.setErrorHandler(Handler.handle);

await app.register(cors, { origin: '*' });

await app.register(fastifyEnv, {
    confKey: 'config',
    dotenv: true,
    schema: config,
});

await app.register(Redis, { url: app.config.REDIS_URL });
await app.register(routes);

export default app;