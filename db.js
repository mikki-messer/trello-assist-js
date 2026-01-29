const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

//create/open db
const db = new sqlite3.Database('projects.db')

//wrapping methods into promises
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.get.all(db));

//db initialization
async function initDatabase() {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_name TEXT UNIQUE NOT NULL,
            last_number INTEGER DEFAULT 0
        )
    `);

    console.log('Database initialization completed successfully');
}

module.exports = {
   initDatabase,
   dbRun,
   dbGet,
   dbAll 
}