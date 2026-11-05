import { logger } from '@travel-suite/utils';

export async function startServer({ app, config, name, connect, onListening }) {
  try {
    if (connect) await connect();

    const server = app.listen(config.port, () => {
      logger.info(`${name} started`, { port: config.port, env: config.nodeEnv });
    });

    if (onListening) await onListening(server);

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled rejection', { error: err });
      server.close(() => process.exit(1));
    });

    return server;
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}
