export default class ErrorReply {
    private readonly statusCode: number;
    private readonly message: string;

    constructor(statusCode: number, message: string) {
        this.statusCode = statusCode;
        this.message = message;
    }

    public toJSON(): object {
        return {
            code: this.statusCode,
            message: this.message,
            timestamp: Date.now(),
        };
    }
}