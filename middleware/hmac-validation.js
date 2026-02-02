const crypto = require('crypto');
require('dotenv').config();

function validateHMAC(req, res, next) {
    try {
        const SIGNATURE_HEADER_FIELD = process.env.TRELLO_SIGNATURE_HEADER_FIELD;

        //get the signature from the header
        const receivedSignature = req.headers[SIGNATURE_HEADER_FIELD];

        //no signature = 401
        if (!receivedSignature) {
            console.error(`Missing ${SIGNATURE_HEADER_FIELD} header`);
            return res.status(401).send('Unauthorized: missing signature');
        }

        const CALLBACK_URL = `${process.env.CALLBACK_URL}${process.env.APP_WEBHOOK_PATH}`;
        const SECRET = process.env.TRELLO_SECRET;

        if (!SECRET) {
            console.error('Trello secret not configured');
            return res.status(500).send('Server Configuration Error');
        }

        if (!CALLBACK_URL) {
            console.error('Callback URL not configured');
            return res.status(500).send('Server Configuration Error');
        }

        const body = JSON.stringify(req.body);

        const content = body + CALLBACK_URL;

        const hmac = crypto.createHmac(process.env.HMAC_ALGORITHM, SECRET);
        hmac.update(content, process.env.HMAC_CONTENT_ENCODING);
        const generatedSignature = hmac.digest(process.env.HMAC_SIGNATURE_ENCODING);

        if (generatedSignature !== receivedSignature) {
            console.error('Invalid HMAC signature');
            console.error('Expected:', generatedSignature);
            console.error('Received:', receivedSignature);
            console.error('Content length:', content.length);
            return res.status(401).send('Unauthorized: Invalid signature');
        }

        console.log('HMAC signature is valid');
        next();
        
    } catch (error) {
        console.error('HMAC validation error:', error.message);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    validateHMAC
}