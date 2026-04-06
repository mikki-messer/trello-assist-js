import 'dotenv/config';
import { showMigrationStatus } from '../src/migrations.js';
import { createLogger } from '../src/logger.js';
import { createDatabase } from '../src/db.js';

const logger = createLogger();
const db = createDatabase();

 showMigrationStatus(db, logger)
    .then(() => {
        console.log('Success!');
        process.exit(0);
    })
    .catch(err => {
        console.log('showMigrationStatus failed');
        console.error(err);
        process.exit(1);
    });