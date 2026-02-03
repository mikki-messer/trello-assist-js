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

async function registerWebhook(boardId, description) {
    try {
        console.log('Registering webhook:');
        console.log(`Board ${boardId} ${description}`);
        console.log(`Callback URL: ${CALLBACK_URL}${WEBHOOK_PATH}`);

        const response = await axios.post(
            TRELLO_REGISTER_WH_URL,
            null,
            {
                params: {
                    key: API_KEY,
                    token: TOKEN,
                    callbackURL: CALLBACK_URL.concat(WEBHOOK_PATH),
                    idModel: boardId,
                    description: description || `${WEBHOOK_DESCRIPTION} - ${boardId}` 
                }
            }
        );

        console.log('Wehbook registered successfully');
        console.log('Webhook ID:', response.data.id);
        console.log('Board ID:', response.data.idModel);
        console.log('Callback URL:', response.data.callbackURL);
        console.log('Active:', response.data.active);

        return response.data;

    } catch (error) {
        console.error('Error registering webhook:',  error.message);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }

        throw error;
    }
    
}

//run command: node register-webhook.js boardId [description]
const boardId = process.argv[2];
const description = process.argv[3];

if (!boardId) {
    console.error('Expected command: node register-webhook.js boardId [description]');
    console.error('Example: node register-webhook.js 5f8b3c2a1d4e "My Awesome Board"');
    console.error('To get board ids run: node scripts/list-boards.js');
    process.exit(1);
}

registerWebhook(boardId, description)
    .then(() => {
        console.log('Webhook registered. Don\'t forget to add this board to config/boards.local.js');
        process.exit(0);
    })
    .catch(() => {
        process.exit(1);
    });