const sqlite3 = require('sqlite3').verbose();
const { resolve } = require('dns');
const { promisify } = require('util');

//create/open db
const db = new sqlite3.Database('projects.db')

//wrapping methods into promises
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
}

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

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