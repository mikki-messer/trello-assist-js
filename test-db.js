const { initDatabase } = require('./db');

async function  testDatabase() {
    try {
        await initDatabase();
        console.log('Success!')

    } catch (error) {
        console.error('Error:', error.message);
    }    
}

testDatabase();