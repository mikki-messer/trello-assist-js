require('dotenv').config();
const express = require('express');
const app = express();
const { incrementProjectCounter } = require('./db');
const { getProjectNameFromIdValue } = require('./trello-utils');

const TRELLO_CUSTOM_FIELD_NAME = process.env.TRELLO_CUSTOM_FIELD_NAME;
const TRELLO_EVENT_TYPE = process.env.TRELLO_EVENT_TYPE;

//Middleware for the JSON parsing
app.use(express.json());

//HEAD endpoint for Trello-checkup
app.head('/webhook', (req, res) => {
    res.status(200).end();
})

//GET endpoint for browser checkup
app.get('/webhook', (req, res) => {
    res.status(200).send('Server is alive! Use POST to send data.');
})

//Endpoint for the Trello webhooks
app.post('/webhook', async (req, res) => {
    console.log('Webhook received!');

    const eventType = req.body.action.type;
    console.log('Event type:', eventType);

    
    if (eventType === TRELLO_EVENT_TYPE) {
        try {
            let customField = req.body.action.data.customField;
            let customFieldItem = req.body.action.data.customFieldItem;
            let card = req.body.action.data.card;

            if (customField.name === TRELLO_CUSTOM_FIELD_NAME) {
                console.log(`Project field changed!`);
                console.log(`Card name:`, card.name);

                let projectName = await getProjectNameFromIdValue(
                    customField.id, 
                    customFieldItem.idValue);

                //TODO: Get project name
                console.log('idValue:', projectName);

                if (projectName) {
                    //increasing counter
                    let newNumber = await incrementProjectCounter(projectName);
                    console.log(`New number for ${projectName}:`, newNumber);
                }
                
            }
        } catch (error) {
            console.error('Error processing webhook:', error.message);
            //TODO: update card name
        }
    }

    res.status(200).send('OK');
    
});

app.get('/', (req, res) => {
    res.status(200).send('It\'s alive!');
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});