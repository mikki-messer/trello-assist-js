require('dotenv').config();
const express = require('express');

const logger = require('./logger');
const { initDatabase, incrementProjectCounter } = require('./db');
const { getProjectNameFromIdValue, updateCardTitle } = require('./trello-utils');
const { formatCardTitle } = require('./utils');
const { validateHMAC } = require('./middleware/hmac-validation');
const { isBoardRegistered, getBoardDescription, getAllBoards } = require('./config/boards');

const app = express();

const CUSTOM_FIELD_NAME = process.env.TRELLO_CUSTOM_FIELD_NAME;
const EVENT_TYPE = process.env.TRELLO_EVENT_TYPE;
const WEBHOOK_PATH = process.env.APP_WEBHOOK_PATH;

//Middleware for the JSON parsing
app.use(express.json());

//HEAD endpoint for Trello-checkup
app.head(WEBHOOK_PATH, (req, res) => {
    res.status(200).end();
})

//GET endpoint for browser checkup
app.get(WEBHOOK_PATH, (req, res) => {
    res.status(200).send('Server is alive! Use POST to send data.');
})

//Endpoint for the Trello webhooks
app.post(WEBHOOK_PATH, validateHMAC, async (req, res) => {
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
        return res.status(200).send('OK'); //200 to keep the endpoint alive
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
                logger.info('Project field changed!', { 
                    cardId: card.id,
                    cardName: card.name 
                });

                const projectName = await getProjectNameFromIdValue(
                    customField.id, 
                    customFieldItem.idValue);

                if (projectName) {
                    logger.info('Project resolved', { projectName });

                    //increasing counter
                    const newNumber = await incrementProjectCounter(projectName);
                    logger.info('Counter incremented', { 
                        projectName, 
                        newNumber });

                    //format new card title
                    const newTitle = formatCardTitle(projectName, newNumber, card.name);

                    //updating card title in Trello
                    await updateCardTitle(card.id, newTitle);

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
        }
    }

    res.status(200).send('OK');
    
});

app.get('/', (req, res) => {
    res.status(200).send('It\'s alive!');
})

const PORT = process.env.PORT || 3000;

app.get(process.env.APP_HEALTHCHECK_PATH, async(req, res) => {
    try {
        //check DB
        const { dbGet } = require('./db');
        await dbGet('SELECT 1');

        //check config
        const { getBoardCount } = require('./config/boards');
        
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
    try {
        const { dbGet } = require('./db');
        await dbGet('SELECT 1');
        res.status(200).end();
    } catch {
        res.status(503).end();
    }
});

async function  startServer() {
    try {
        logger.info('Starting server...');

        //Initializing database
        logger.info('Initializing database');
        await initDatabase();
        logger.info('Database initialized');

        //checking board configuration
        const { getBoardCount } = require('./config/boards')
        const boardCount = getBoardCount();

        if (boardCount === 0) {
            logger.warn('No boards configured in boards.local.js, all webhooks will be ignores');
        } else {
            logger.info(`${boardCount} boards(s) registerds`);
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

process.on('uncaughtException', (reason, promise) => {
    logger.error('Uncaught Exception', {
        reason: reason,
        promise: promise
    });

    process.exit(1);
});

//Graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGNIT received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
})

//test unused variable
var testVar = 123;

//Starting the application
startServer();