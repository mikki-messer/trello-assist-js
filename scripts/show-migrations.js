import 'dotenv/config';
import { showMigrationStatus } from '../migrations.js';

 showMigrationStatus()
    .then(() => {
        console.log('Success!');
        process.exit(0);
    })
    .catch(err => {
        console.log('showMigrationStatus failed');
        console.error(err);
        process.exit(1);
    });