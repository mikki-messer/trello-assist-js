#!/usr/bin/env node

/**
 * Register Trello webhooks for all boards from boards.local.js
 * Usage: node scripts/register-webhook.js
 */

const axios = require('axios');
require('dotenv').config();

// Import boards configuration
const { boards } = require('../config/boards.local.js');

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const CALLBACK_URL = process.env.CALLBACK_URL;
const WEBHOOK_DESCRIPTION = process.env.TRELLO_WEBHOOK_DESCRIPTION;
const WEBHOOK_PATH = process.env.APP_WEBHOOK_PATH

// Validate environment variables
if (!TRELLO_API_KEY || !TRELLO_TOKEN || !CALLBACK_URL || !WEBHOOK_DESCRIPTION || !WEBHOOK_PATH) {
    console.error('Error: Missing required environment variables');
    console.error('Required: TRELLO_API_KEY, TRELLO_TOKEN, CALLBACK_URL, WEBHOOK_DESCRIPTION, WEBHOOK_PATH');
    process.exit(1);
}

// Validate boards configuration
if (!boards || Object.keys(boards).length === 0 === 0) {
    console.error('Error: No boards found in config/boards.local.js');
    process.exit(1);
}

/**
 * Register webhook for a single board
 */
async function registerWebhook(boardId, description) {
    try {
        const response = await axios.post(
            'https://api.trello.com/1/webhooks',
            null,
            {
                params: {
                    key: TRELLO_API_KEY,
                    token: TRELLO_TOKEN,
                    callbackURL: `${CALLBACK_URL}${WEBHOOK_PATH}`,
                    idModel: boardId,
                    description: `${WEBHOOK_DESCRIPTION} ${description}`
                }
            }
        );

        console.log(`Successfully registered for ${description}`);
        console.log(`   Webhook ID: ${response.data.id}`);
        console.log(`   Board ID: ${boardId}`);
        console.log('');

        return { success: true, board: description, webhookId: response.data.id };
    } catch (error) {
        console.error(`Registration failed for ${description}`);
        
        if (error.response) {
            console.error(`   Error: ${error.response.data}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        console.log('');

        return { success: false, board: description, error: error.message };
    }
}

/**
 * Main function
 */
async function main() {
    const boardIds = Object.keys(boards);

    console.log('');
    console.log('Registering Trello Webhooks');
    console.log('================================');
    console.log(`Callback URL: ${CALLBACK_URL}${WEBHOOK_PATH}`);
    console.log(`Boards to register: ${boardIds.length}`);
    console.log('');

    const results = [];

    for (const boardId of boardIds) {
        const description = boards[boardId];
        console.log(`Registering webhook for: ${boardId} ${description}`);
        const result = await registerWebhook(boardId, description);
        results.push(result);
    }

    // Summary
    console.log('================================');
    console.log('📊 Summary:');
    console.log('');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log('');

    if (failed > 0) {
        console.log('Failed boards:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.board}: ${r.error}`);
        });
        console.log('');
        process.exit(1);
    }

    console.log('✅ All webhooks registered successfully!');
    console.log('');
}

// Run
main().catch(error => {
    console.error('');
    console.error('Fatal error:', error.message);
    console.error('');
    process.exit(1);
});