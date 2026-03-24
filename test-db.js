import { initDatabase } from './db.js';

async function  testDatabase() {
    try {
        await initDatabase();
        console.log('Success!')

    } catch (error) {
        console.error('Error:', error.message);
    }    
}

testDatabase();