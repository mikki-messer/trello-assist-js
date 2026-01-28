require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

// ID webhook который ты получил
const WEBHOOK_ID = 'webhookId';

async function deleteWebhook() {
    try {
        await axios.delete(
            `https://api.trello.com/1/webhooks/${WEBHOOK_ID}`,
            { params: { key: API_KEY, token: TOKEN } }
        );

        console.log('✅ Webhook удалён!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

deleteWebhook();