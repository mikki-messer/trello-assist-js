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

async function getOrCreateProject(projectName) {
    try {
        //fetching existing project
        let project = await dbGet(
            'SELECT * FROM projects WHERE project_name = ?',
            [projectName]
        );

        if (!project) {
            await dbRun(
                'INSERT INTO projects (project_name, last_number) VALUES (?, ?)',
                [projectName, 0]
            );

            project = await dbGet(
                'SELECT * FROM projects WHERE project_name = ?',
                [projectName]
            );
        }

        return project;
    } catch (error) {
        console.error('getOrCreateProject failed:', error.message);
        throw error;
    }
}

async function incrementProjectCounter(projectName) {
    try {
        //making sure the project exists in the DB
        await getOrCreateProject(projectName);

        //increasing the last_number
        await dbRun(
            'UPDATE projects SET last_number = last_number + 1 WHERE project_name = ?',
            [projectName]
        );

        //getting the updated value
        const project = await getOrCreateProject(projectName);

        return project.last_number;
    } catch (error) {
        console.error('incrementProjectCounter failed:', error.message);
        throw error;
    } 
}

module.exports = {
   initDatabase,
   dbRun,
   dbGet,
   dbAll,
   getOrCreateProject,
   incrementProjectCounter 
}