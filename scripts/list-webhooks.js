require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

async function listWebhooks() {
    try {
        const response = await axios.get(
            `https://api.trello.com/1/tokens/${TOKEN}/webhooks`,
            { params: {key: API_KEY} }
        );            
        console.log('Active Webhooks:');
        response.data.forEach(webhook => {
            console.log(`ID: ${webhook.id}`);
            console.log(`Board ID: ${webhook.idModel}`);
            console.log(`Callback URL: ${webhook.callbackURL}`);
            console.log(`Description: ${webhook.description}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error listing webhooks:', error.message);
    }
}

listWebhooks();