require('dotenv').config();
const axios = require('axios');
//const fs = require('fs');

//fetching keys from .env
const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

async function getMyBoards() {
    try {
        const response = await axios.get('https://api.trello.com/1/members/me/boards', {
            params: {key: API_KEY, token: TOKEN}
            }
        );        

        console.log('My Boards:');
        response.data.forEach(board => {
            console.log(board.name);
        });
        //console.log(JSON.stringify(response.data, null, 2));
        //fs.writeFileSync('trello-response.json', JSON.stringify(response.data, null, 2));
        console.log('file saved');

    } catch (error) {
        console.error('Error:', error.message)
    }
}

getMyBoards();