export default {
    type: 'object',
    required: [],
    properties: {
        DEFAULT_TTL: {
            type: 'number',
            default: 300
        },
        HTTP_PORT: {
            type: 'number',
            default: 80
        },
        MAX_TTL: {
            type: 'number',
            default: 10080
        },
        MAX_SIZE: {
            type: 'number',
            default: 1
        },
        MIN_ENTROPY_SCORE: {
            type: 'number',
            default: 6.5
        },
        REDIS_URL: {
            type: 'string',
            default: 'redis://127.0.0.1:6379'
        },
    }
}