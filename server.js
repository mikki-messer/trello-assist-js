require("dotenv").config();
const express = require('express');
const app = express();

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
app.post('/webhook', (req, res) => {
    console.log('Webhook received');
    console.log('Event type:', req.body.action.type);
    //console.log(req.body);
    console.log(JSON.stringify(req.body.action.data, null, 2));
    res.status(200).send('OK');
});

app.get('/', (req, res) => {
    res.status(200).send('It\'s alive!');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});