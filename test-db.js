import { createDatabase, initDatabase } from './src/db.js';
import { createLogger } from './src/logger.js';

const logger = createLogger();

async function testDatabase() {
    try {
        const db = createDatabase();
        await initDatabase(db, logger);
        console.log('Success!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDatabase();
