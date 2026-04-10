import 'dotenv/config';

import pkg from 'sqlite3';
const sqlite3 = pkg.verbose();
import { runMigrations } from './migrations.js';

/**
 * Create database connection
 * @param {string} dbPath - Path to database file
 * @returns {sqlite3.Database} Database instance
 */

export function createDatabase(dbPath = process.env.DB_PATH) {
    //create/open db
    const db = new sqlite3.Database(dbPath);
    //turning on the WAL mode
    db.run('PRAGMA journal_mode = WAL');
    return db;
}

/**
 * Run SQL query (promisified)
 * @param {sqlite3.Database} db - Database instance
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{lastID: number, changes: number}>}
 */

export function dbRun(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
}

/**
 * Get single row (promisified)
 * @param {sqlite3.Database} db - Database instance
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|undefined>}
 */
export function dbGet(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Get all rows (promisified)
 * @param {sqlite3.Database} db - Database instance
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
export function dbAll (db, sql, params = []) {
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

/**
 * Initialize database schema
 * @param {sqlite3.Database} db - Database instance
 * @param {winston.Logger} logger - Logger instance
 */
export async function initDatabase(db, logger) {
        logger.info('DB initialization...');
        await runMigrations(db, logger);
        logger.info('DB initialized successfully');
}

/**
 * Get or create project
 * @param {sqlite3.Database} db - Database instance
 * @param {winston.Logger} logger - Logger instance
 * @param {string} projectName - Project name
 * @returns {Promise<{id: number, project_name: string, last_number: number}>}
 */
export async function getOrCreateProject(db, logger, projectName) {
        //fetching existing project
        let project = await dbGet(
            db,
            'SELECT * FROM projects WHERE project_name = ?',
            [projectName]
        );

        if (!project) {
            logger.info('Creating new project',{ projectName });

            await dbRun(
                db,
                'INSERT INTO projects (project_name, last_number) VALUES (?, ?)',
                [projectName, 0]
            );

            project = await dbGet(
                db,
                'SELECT * FROM projects WHERE project_name = ?',
                [projectName]
            );
        }

        return project;
}

/**
 * Increment project counter
 * @param {sqlite3.Database} db - Database instance
 * @param {winston.Logger} logger - Logger instance
 * @param {string} projectName - Project name
 * @returns {Promise<number>} New counter value
 */
export async function incrementProjectCounter(db, logger, projectName) {
        //making sure the project exists in the DB
        await getOrCreateProject(db, logger, projectName);

        //increasing the last_number
        await dbRun(
            db,
            'UPDATE projects SET last_number = last_number + 1 WHERE project_name = ?',
            [projectName]
        );

        //getting the updated value
        const project = await getOrCreateProject(db, logger, projectName);

        return project.last_number;
}
