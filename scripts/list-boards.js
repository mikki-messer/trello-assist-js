require('dotenv').config();
const axios = require('axios');

async function  listBoards() {
    try {
        const response = await axios.get(
            process.env.TRELLO_BOARDS_URL, {
                params: {
                    key: process.env.TRELLO_API_KEY,
                    token: process.env.TRELLO_TOKEN,
                    fields: 'id,name,closed'
                }
            }
        );

        console.log('List of Boards:');

        response.data
            .filter(board => !board.closed)
            .forEach(board => {
                console.log(`Board name: ${board.name}`);
                console.log(`Board id: ${board.id}`);
                console.log('---')
            })
    } catch (error) {
        console.error('Fetch boards error:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }    
}

listBoards();