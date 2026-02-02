require('dotenv').config();
const express = require('express');

const { incrementProjectCounter } = require('./db');
const { getProjectNameFromIdValue, updateCardTitle } = require('./trello-utils');
const { formatCardTitle } = require('./utils');
const { validateHMAC } = require('./middleware/hmac-validation');
const { isBoardRegistered, getBoardDescription } = require('./config/boards')

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
    console.log('Webhook received!');

    const eventType = req.body.action.type;
    const boardId = req.body.model.id;
    const boardName = req.body.model.name;

    console.log('Event type:', eventType);
    console.log('Board ID:', boardId);
    console.log('Board Name:', boardName);

    if (!isBoardRegistered(boardId)) {
        console.warn(`Webhook from unregistered board ${boardId} ${boardName}`);
        console.warn('Add it to config/boards.js to enable it');
        return res.status(200).send('OK'); //200 to keep the endpoint alive
    }

    console.log (`Webhook from registered board ${getBoardDescription(boardId)}`)

    if (eventType === EVENT_TYPE) {
        try {
            const customField = req.body.action.data.customField;
            const customFieldItem = req.body.action.data.customFieldItem;
            const card = req.body.action.data.card;

            if (customField.name === CUSTOM_FIELD_NAME) {
                console.log(`Project field changed!`);
                console.log(`Card name:`, card.name);

                const projectName = await getProjectNameFromIdValue(
                    customField.id, 
                    customFieldItem.idValue);

                //TODO: Get project name
                console.log('idValue:', projectName);

                if (projectName) {
                    //increasing counter
                    const newNumber = await incrementProjectCounter(projectName);
                    console.log(`New number for ${projectName}:`, newNumber);

                    //format new card title
                    const newTitle = formatCardTitle(projectName, newNumber, card.name);
                    console.log('New title:', newTitle);

                    //updating card title in Trello
                    await updateCardTitle(card.id, newTitle);

                    console.log(`Card ${card.id} updated successfully`);
                }
                
            }
        } catch (error) {
            console.error('Error processing webhook:', error.message);
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
        console.error('Health check failed:', error.message);
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
    } catch (error) {
        res.status(503).end();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});