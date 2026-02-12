import App from './src/app.js';

App.listen({ host: '0.0.0.0', port: App.config.HTTP_PORT }, function (error: any, address: any): void {
    if (error) {
        App.log.error(error);
        process.exit(1);
    }

    App.log.info(`server listening on ${address}`);
});

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
    process.on(signal, async (): Promise<void> => {
        App.log.info(`Received ${signal}, closing server...`);
        await App.close();
        process.exit(0);
    });
}