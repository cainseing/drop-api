export default class Drop {
    public blob: string
    public provider: string
    public reads: number
    public sender: string
    public signature: string
    public ttl: number

    constructor(blob: string, provider: string, reads: number, sender: string, signature: string, ttl: number)
    {
        this.blob = blob;
        this.provider = provider;
        this.reads = reads;
        this.sender = sender;
        this.signature = signature;
        this.ttl = ttl;
    }

    public static fromJSON(data: any): Drop {
        return new Drop(data.blob, data.provider, data.reads, data.sender, data.signature, data.ttl);
    }
}