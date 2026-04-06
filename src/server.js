import 'dotenv/config';
import express from 'express';

import { createLogger } from './logger.js';
import { 
    createDatabase,
    initDatabase,
    incrementProjectCounter,
    dbGet 
} from './db.js';
import { getProjectNameFromIdValue, updateCardTitle } from './utils/trello-utils.js';
import { formatCardTitle } from './utils/format.js';
import { validateHMAC } from './middleware/hmac-validation.js';
import { isBoardRegistered, getBoardDescription, getAllBoards, getBoardCount } from './config/boards.js';
import { validateEnv } from './utils/validate-env.js';
import { contextMiddleware } from './middleware/context.js';

const CUSTOM_FIELD_NAME = process.env.TRELLO_CUSTOM_FIELD_NAME;
const EVENT_TYPE = process.env.TRELLO_EVENT_TYPE;
const WEBHOOK_PATH = process.env.APP_WEBHOOK_PATH;

const app = express();

//Create local instances
const logger = createLogger();
const db = createDatabase();

//Middleware
app.use(express.json());
app.use(contextMiddleware(logger, db));

//HEAD endpoint for Trello-checkup
app.head(WEBHOOK_PATH, (req, res) => {
    const { logger } = req;

    logger.debug('Health check requested');

    res.status(200).end();
})

//GET endpoint for browser checkup
app.get(WEBHOOK_PATH, (req, res) => {
    const { logger } = req;

    logger.debug(`Get request received for the ${WEBHOOK_PATH}`);

    res.status(200).send('Server is alive! Use POST to send data.');
})

//Endpoint for the Trello webhooks
app.post(WEBHOOK_PATH, validateHMAC, async (req, res) => {
    const { logger, db } = req;

    const eventType = req.body.action?.type;
    const boardId = req.body.model?.id;
    const boardName = req.body.model?.name;

    logger.info('Webhook received!', {
        eventType,
        boardId,
        boardName
    });

    if (!isBoardRegistered(boardId)) {
        logger.warn('Webhook from unregistered board - ignored, add it to config/boards.js to enable it', {
            boardId,
            boardName,
            registeredBoards: getAllBoards()
        }); 
        return res.status(200).send('Webhook from unregistered board - ignored'); //200 to keep the endpoint alive
    }

    logger.info('Webhook from registered board', {
         boardId,
         description: getBoardDescription(boardId)
    });

    if (eventType === EVENT_TYPE) {
        try {
            const customField = req.body.action.data.customField;
            const customFieldItem = req.body.action.data.customFieldItem;
            const card = req.body.action.data.card;

            if (customField.name === CUSTOM_FIELD_NAME) {
                logger.info(`${CUSTOM_FIELD_NAME} field changed!`, { 
                    cardId: card.id,
                    cardName: card.name 
                });

                const projectName = await getProjectNameFromIdValue(
                    logger,
                    customField.id, 
                    customFieldItem.idValue);

                if (projectName) {
                    logger.info(`${CUSTOM_FIELD_NAME} resolved`, { projectName });

                    //increasing counter
                    const newNumber = await incrementProjectCounter(db, logger, projectName);
                    logger.info('Counter incremented', { 
                        projectName, 
                        newNumber });

                    //format new card title
                    const newTitle = formatCardTitle(projectName, newNumber, card.name);

                    //updating card title in Trello
                    await updateCardTitle(logger, card.id, newTitle);

                    logger.info('Card updated successfully', {
                        cardId: card.id,
                        oldTitle: card.name,
                        newTitle
                    });
                }
                
            }
        } catch (error) {
            logger.error('Error processing webhook:', {
                error: error.message,
                stack: error.stack,
                eventType,
                boardId 
            });

        return res.status(500).json({ 
            error: 'Internal server error' 
        });
        }
    }

    res.status(200).send('OK');
    
});

app.get('/', (req, res) => {
    const { logger } = req;

    logger.info(`Get request received for the root`);

    res.status(200).send('It\'s alive!');
})

const PORT = process.env.PORT || 3000;

app.get(process.env.APP_HEALTHCHECK_PATH, async(req, res) => {
    const { logger, db } = req;
    try {
        //check DB
        await dbGet(db, 'SELECT 1');

        logger.info(`Get health request received for ${process.env.APP_HEALTHCHECK_PATH}`);

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: 'connected',
            boards_registered: getBoardCount()
        });

    } catch (error) {
        logger.error('Health check failed:', { 
            message: error.message
         });

        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.head(process.env.APP_HEALTHCHECK_PATH, async(req, res) => {
    //easy check
    const { logger, db } = req;
    try {
        logger.info(`Get health request received for ${process.env.APP_HEALTHCHECK_PATH}`);

        await dbGet(db, 'SELECT 1');
        res.status(200).end();
    } catch (error) {
        logger.error('Health check failed:', { 
            message: error.message
         });
        res.status(503).end();
    }
});

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
        app.listen(PORT, () => {
            logger.info('Server launched', {
                port: PORT,
                environment: process.env.NODE_ENV,
                boards_registered: boardCount
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

//Graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
})

//Starting the application
startServer();