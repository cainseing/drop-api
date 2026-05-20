import Handler from './Errors/Handler.js';
import Redis from '@fastify/redis';
import config from './Schemas/config.js';
import cors from '@fastify/cors';
import fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import rateLimit from '@fastify/rate-limit';
import routes from '../routes.js';
import { registerCommands } from './Helpers/RedisCommands.js';

const app: fastify.FastifyInstance = fastify({ logger: true });

// app.setErrorHandler(Handler.handle);

await app.register(cors, { origin: '*' });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

await app.register(fastifyEnv, {
    confKey: 'config',
    dotenv: true,
    schema: config,
});

await app.register(Redis, { password: app.config.REDIS_PASSWORD, url: app.config.REDIS_URL });

registerCommands(app.redis);

await app.register(routes);

export default app;