require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const CUSTOM_FIELDS_URL = process.env.TRELLO_CUSTOM_FIELDS_URL

async function getCustomFieldOptions(customFieldId) {
    try {
        const response = await axios.get(
            CUSTOM_FIELDS_URL.concat(customFieldId),
            { params: { key: API_KEY, token: TOKEN } }
        );

        console.log('Custom Field Info:');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

//run command: node test-custom-field.js fieldId
const CUSTOM_FIELD_ID = process.argv[2];

getCustomFieldOptions(CUSTOM_FIELD_ID);