import 'dotenv/config';
import express from 'express';

import { createLogger } from './logger.js';
import { 
    createDatabase,
    initDatabase,
} from './db.js';
import { validateHMAC } from './middleware/hmac-validation.js';
import { getBoardCount } from './config/boards.js';
import { validateEnv } from './utils/validate-env.js';
import { contextMiddleware } from './middleware/context.js';

import { handleWebhookHead } from './handlers/webhook-head.js';
import { handleWebhookGet } from './handlers/webhook-get.js';
import { handleWebhookPost } from './handlers/webhook-post.js';
import { handleHealthGet } from './handlers/health-get.js';
import { handleHealthHead } from './handlers/health-head.js';
import { handleRootGet } from './handlers/root-get.js';

const WEBHOOK_PATH = process.env.APP_WEBHOOK_PATH;
const HEALTHCHECK_PATH = process.env.APP_HEALTHCHECK_PATH;

const app = express();

//Create local instances
const logger = createLogger();
const db = createDatabase();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(express.json());
app.use(contextMiddleware(logger, db));

app.head(WEBHOOK_PATH, handleWebhookHead);
app.get(WEBHOOK_PATH, handleWebhookGet);
app.post(WEBHOOK_PATH, validateHMAC, handleWebhookPost);

app.get('/', handleRootGet);

app.get(HEALTHCHECK_PATH, handleHealthGet);
app.head(HEALTHCHECK_PATH, handleHealthHead);

async function  startServer() {
    try {
        logger.info('Starting server...');

        //checking the envs
        validateEnv(logger);

        //Initializing database
        logger.info('Initializing database');
        await initDatabase(db, logger);
        logger.info('Database initialized');

        //checking board configuration
        const boardCount = getBoardCount();

        if (boardCount === 0) {
            logger.warn('No boards configured in boards.local.js, all webhooks will be ignored');
        } else {
            logger.info(`${boardCount} board(s) registered`);
        }
        
        //Start server
        const server = app.listen(PORT, () => {
            logger.info('Server launched', {
                port: PORT,
                environment: process.env.NODE_ENV,
                boards_registered: boardCount
            });
        });

        //Graceful shutdown
        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger.info('Server closed, exiting');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger.info('Server closed, exiting');
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });

        console.error('Fatal error: server terminated');

        process.exit(1);
    }
}

// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
        reason: reason,
        promise: promise
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });

    process.exit(1);
});

//Starting the application
startServer();