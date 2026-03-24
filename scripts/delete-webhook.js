import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

async function deleteWebhook(webhookId) {
    try {
        await axios.delete(
            `https://api.trello.com/1/webhooks/${webhookId}`,
            { params: { key: API_KEY, token: TOKEN } }
        );
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

//run command: node delete-webhook.js webhookId
const webhookId = process.argv[2];

if (!webhookId) {
    console.error('Expected command: node delete-webhook.js webhookId');
    console.error('Example: node delete-webhook.js 69a41cdf81af39185c49fd5a');
    console.error('To get webhook ids run: node scripts/list-webhooks.js');
    process.exit(1);
}

deleteWebhook(webhookId)
    .then(() => {
        console.log('Webhook deleted');
        process.exit(0);
    })
    .catch(() => {
        process.exit(1);
    });
