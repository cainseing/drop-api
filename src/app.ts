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

app.setErrorHandler(Handler.handle);

await app.register(cors, { origin: '*' });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

await app.register(fastifyEnv, {
    confKey: 'config',
    dotenv: true,
    schema: config,
});

await app.register(Redis, {
    password: app.config.REDIS_PASSWORD,
    url: app.config.REDIS_URL,
    // Without these, a connection that dies silently (no FIN/RST, e.g. a network blip or an
    // idle-timeout on a firewall/NAT) is never detected, so ioredis never reconnects and every
    // request hangs forever.
    connectTimeout: 5000,
    keepAlive: 10000,
    socketTimeout: 5000, // no reply within 5s after a write: drop the socket and reconnect
    commandTimeout: 5000, // fail the request instead of hanging it
    maxRetriesPerRequest: 2, // fail fast while Redis is down instead of queueing for ~20 retries
});

app.redis.on('error', (error: Error) => app.log.error({ err: error }, 'redis error'));
app.redis.on('reconnecting', (delay: number) => app.log.warn(`redis reconnecting in ${delay}ms`));
app.redis.on('ready', () => app.log.info('redis connected'));

registerCommands(app.redis);

await app.register(routes);

export default app;