require('dotenv').config();
const { showMigrationStatus } = require('../migrations');

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