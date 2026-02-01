const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const CUSTOM_FIELDS_URL = process.env.TRELLO_CUSTOM_FIELDS_URL;
const CARDS_URL = process.env.TRELLO_CARDS_URL;

//cache for keeping customFieldOptions
let customFieldOptionsCache = {};

//fetch customFieldOptions
async function getCustomFieldOptions(customFieldId) {
    //return if already cached
    if (customFieldOptionsCache[customFieldId]){
        return customFieldOptionsCache[customFieldId];
    }
    
    try {
        const response = await axios.get(
            CUSTOM_FIELDS_URL.concat(customFieldId),
            { params: { key: API_KEY, token: TOKEN } }
        );

        //creating mapping id -> text
        const optionsMap = {};
        response.data.options.forEach(option => {
            optionsMap[option.id] = option.value.text;
        });

        //saving to cache
        customFieldOptionsCache[customFieldId] = optionsMap;

        return optionsMap;
    }
    catch (error) {
        console.error('Error fetching custom field options:', error.message);
        return {};
    }
}

//getting field value name by idValue
async function getProjectNameFromIdValue(customFieldId, idValue) {
    const options = await getCustomFieldOptions(customFieldId);
    return options[idValue] || null;
}

async function updateCardTitle(cardId, newTitle) {
    try {
        const response = await axios.put(
            `${CARDS_URL}${cardId}`,
            null,
            {
                params: {
                    key: API_KEY,
                    token: TOKEN,
                    name: newTitle
                }
            }
        );

        console.log(`Card title updated: ${newTitle}`);
        return response.data;

    } catch (error) {
        console.error(`Error updating card ${cardId} title:`, newTitle);
        throw error;
    }
}
module.exports = {
    getProjectNameFromIdValue,
    updateCardTitle
};