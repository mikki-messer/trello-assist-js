/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are present
 * before starting the application. Exits with code 1 if any are missing.
 */

const logger = require('../logger');

// Required environment variables
const REQUIRED_VARS = [
    'TRELLO_API_KEY',
    'TRELLO_TOKEN',
    'TRELLO_SECRET',
    'TRELLO_REGISTER_WH_URL',
    'TRELLO_CUSTOM_FIELDS_URL',
    'TRELLO_CARDS_URL',
    'TRELLO_BOARDS_URL',
    'TRELLO_CUSTOM_FIELD_NAME',
    'TRELLO_EVENT_TYPE',
    'TRELLO_WEBHOOK_DESCRIPTION=Project field automation',
    'TRELLO_SIGNATURE_HEADER_FIELD',
    'CALLBACK_URL',
    'PORT',
    'HMAC_ALGORITHM',
    'HMAC_CONTENT_ENCODING',
    'HMAC_SIGNATURE_ENCODING',
    'APP_WEBHOOK_PATH',
    'APP_HEALTHCHECK_PATH',
    'PRODUCTION_ENV_NAME',
    'NODE_ENV',
    'LOG_LEVEL',
    'LOGS_TIMESTAMP_FORMAT',
    'LOG_ERROR_FILE_NAME',
    'LOG_COMBINED_FILE_NAME',
    'LOG_ERROR_LEVEL',
    'MAX_LOG_SIZE',
    'MAX_FILE_NUMBER'
];

/**
 * Validate required environment variables
 * @throws {Error} If any required variable is missing
 */
function validateEnv() {
    const missing = [];
    
    // Check required variables
    REQUIRED_VARS.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });
    
    // If any are missing, exit with error
    if (missing.length > 0) {
        console.error('\nMissing required environment variables:\n');
        missing.forEach(key => {
            console.error(`   - ${key}`);
        });
        console.error('\nPlease check your .env file');
        console.error('See .env.example for reference\n');
        process.exit(1);
    }
    
    // Log successful validation
    logger.info('Environment variables validated', {
        required: REQUIRED_VARS.length
    });    
}

module.exports = { validateEnv };
