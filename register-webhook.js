require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const WEBHOOK_DESCRIPTION = process.env.TRELLO_WEBHOOK_DESCRIPTION;

//ngrok URL
const CALLBACK_URL = process.env.CALLBACK_URL;
//APP webhook path
const WEBHOOK_PATH = process.env.APP_WEBHOOK_PATH;

//board ID
const BOARD_ID = process.env.BOARD_ID;
const TRELLO_REGISTER_WH_URL = process.env.TRELLO_REGISTER_WH_URL;

async function registerWebhook() {
    try {
        const response = await axios.post(
            TRELLO_REGISTER_WH_URL,
            null,
            {
                params: {
                    key: API_KEY,
                    token: TOKEN,
                    callbackURL: CALLBACK_URL.concat(WEBHOOK_PATH),
                    idModel: BOARD_ID,
                    description: WEBHOOK_DESCRIPTION
                }
            }
        );

        console.log('Wehbook registered successfully');
        console.log('Webhook ID:', response.data.id);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
    
}

registerWebhook();