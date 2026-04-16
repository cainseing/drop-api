export interface IStoreRequest {
    Body: {
        blob: string;
        provider: string;
        reads: number;
        sender: string;
        signature: string;
        ttl: number;
    },
}