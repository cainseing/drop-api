export interface IStoreRequest {
    Body: {
        blob: string;
        reads: number;
        ttl: number;
    },
}