const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');

//create/open db
const db = new sqlite3.Database('projects.db')

//turning on the WAL mode
db.run('PRAGMA journal_mode = WAL');

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

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        })
    });
}

function dbAll (sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    });
} 

//db initialization
async function initDatabase() {
    try {
        logger.info('DB initialization...');
        const {runMigrations } = require('./migrations');
        await runMigrations();

        logger.info('DB initialized successfully');
    } catch (error) {
        logger.error('DB initialization failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function getOrCreateProject(projectName) {
    try {
        //fetching existing project
        let project = await dbGet(
            'SELECT * FROM projects WHERE project_name = ?',
            [projectName]
        );

        if (!project) {
            logger.info('Creating new project',{ projectName });

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
        logger.error('getOrCreateProject failed:', {
            error: error.message,
            projectName
        })
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
        logger.error('incrementProjectCounter failed:', {
            message: error.message,
            projectName
        });
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