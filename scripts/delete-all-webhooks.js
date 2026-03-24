#!/usr/bin/env node

/**
 * Delete all Trello webhooks
 * Usage: node scripts/delete-webhooks.js
 */

import axios from 'axios';
import 'dotenv/config';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

// Validate environment variables
if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    console.error('Error: Missing required environment variables');
    console.error('Required: TRELLO_API_KEY, TRELLO_TOKEN');
    process.exit(1);
}

/**
 * Get all existing webhooks
 */
async function getWebhooks() {
    try {
        const response = await axios.get(
            `https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks`,
            {
                params: {
                    key: TRELLO_API_KEY
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error getting webhooks');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error('   Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error:', error.message);
        }
        
        throw error;
    }
}

/**
 * Delete a single webhook
 */
async function deleteWebhook(webhook) {
    try {
        await axios.delete(
            `https://api.trello.com/1/webhooks/${webhook.id}`,
            {
                params: {
                    key: TRELLO_API_KEY,
                    token: TRELLO_TOKEN
                }
            }
        );
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message 
        };
    }
}

/**
 * Main function
 */
async function main() {
    console.log('');
    console.log('  Deleting Trello Webhooks');
    console.log('================================');
    console.log('');

    // Get existing webhooks
    console.log(' Fetching existing webhooks...');
    console.log('');

    const webhooks = await getWebhooks();

    if (webhooks.length === 0) {
        console.log('No webhooks found');
        console.log('Nothing to delete!');
        return;
    }

    console.log(`Webhooks found: ${webhooks.length}`);
    console.log('');

    webhooks.forEach((webhook, index) => {
        console.log(`${index + 1}. ${webhook.description || 'Unnamed webhook'}`);
        console.log(`   ID: ${webhook.id}`);
        console.log(`   URL: ${webhook.callbackURL}`);
        console.log(`   Active: ${webhook.active ? 'Yes' : 'No'}`);
        if (webhook.consecutiveFailures > 0) {
            console.log(`   Failures: ${webhook.consecutiveFailures} !!!`);
        }
        console.log('');
    });

    console.log('================================');
    console.log('');
    console.log('  Deleting webhooks...');
    console.log('');

    const results = [];

    for (const webhook of webhooks) {
        const name = webhook.description || webhook.id;
        process.stdout.write(`   Deleting: ${name}... `);
        
        const result = await deleteWebhook(webhook);
        
        if (result.success) {
            console.log('Deleted successfully');
            results.push({ success: true, webhook: name });
        } else {
            console.log('Deletion failed');
            console.log(`      Error: ${result.error}`);
            results.push({ success: false, webhook: name, error: result.error });
        }
    }

    // Summary
    console.log('');
    console.log('================================');
    console.log('Summary:');
    console.log('');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`   Deleted: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log('');

    if (failed > 0) {
        console.log('Failed deletions:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.webhook}: ${r.error}`);
        });
        console.log('');
        process.exit(1);
    }

    console.log('All webhooks deleted successfully!');
    console.log('');
}

// Run
main().catch(error => {
    console.error('');
    console.error('Fatal error:', error.message);
    console.error('');
    process.exit(1);
});