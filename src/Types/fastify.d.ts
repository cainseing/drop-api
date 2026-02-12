import fastify from 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            DEFAULT_TTL: number,
            HTTP_PORT: number,
            MAX_SIZE: number,
            MAX_TTL: number,
            MIN_ENTROPY_SCORE: number,
            REDIS_URL: string,
        },
    }
}