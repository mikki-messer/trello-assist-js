import { dbRun, dbGet, dbAll } from './db.js';

/**
 * Database Migration System
 * 
 * Migrations are applied sequentially and tracked in the migrations table.
 * Each migration has a version number and can be applied only once.
 */

// ============================================
// Migration Infrastructure
// ============================================

/**
 * Create migrations tracking table
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 */

async function createMigrationsTable(db, logger) {
    await dbRun(
        db,`
        CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT NOT NULL
            )
        `);

    logger.debug('Migrations table ready');
}

/**
 * Get current database version
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 * @returns {Promise<number>} Current version (0 if no migrations applied)
 */

export async function getCurrentVersion(db, logger){
    try {
        const result = await dbGet(db, 'SELECT MAX(version) as version FROM migrations');
        return result?.version || 0;
    } catch {
        // Table doesn't exist yet
        logger.info('Table does not exist yet');
        return 0;
    }
}

/**
 * Check if migration was already applied
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 * @param {number} version
 * @returns {Promise<boolean>}
 */


async function isMigrationApplied(db, logger, version) {
    const currentVersion = await getCurrentVersion(db, logger);
    return currentVersion >= version;    
}

/**
 * Record migration to database
 * @param {sqlite3.Database} db
 * @param {number} version
 * @param {string} description
 */

async function recordMigration(db, version, description) {
    await dbRun(
        db,
        'INSERT INTO migrations (version, description) VALUES (?, ?)',
        [version, description]
    );
}

/**
 * Apply a single migration
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 * @param {number} version
 * @param {string} description
 * @param {Function} upFunction
 */

async function applyMigration(db, logger, version, description, upFunction) {
    //checking if already applied
    if (await isMigrationApplied(db, logger, version)) {
        logger.debug(`Migration ${version} is already applied: ${description}`);
        return;
    }

    logger.info(`Applying migration ${version}: ${description}`);

    try {
        //execute migration
        await upFunction(db, logger);

        //record to the migrations table
        await recordMigration(db, version, description);

        logger.info(`Migration ${version} applied successfully`);
    } catch (error) {
        logger.error(`Migration ${version} failed`, {
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Migration ${version} failed ${error.message}`, {
            cause: error
        });
    }
}

// ============================================
// Migrations
// ============================================

/**
 * Migration 1: Create initial projects table
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 */

async function migration0001_createProjectsTable(db, logger) {
    await dbRun(db, `
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT UNIQUE NOT NULL,
                last_number INTEGER DEFAULT 0    
            )
        `);

    logger.info('Created projects table');
}

/**
 * Migration 2: Add created_at timestamp to projects
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 */

async function migration0002_addCreatedAt(db, logger) {
    // Check if column already exists
    const tableInfo = await dbAll (db, 'PRAGMA table_info(projects)');
    const hasCreatedAt = tableInfo.some(col => col.name === 'created_at');

    if (hasCreatedAt) {
        logger.info('Column created_at already exists, skipping the migration');
        return;
    }

    await dbRun(db, 'BEGIN TRANSACTION');

    try {
        //recreating the table
        logger.info('Creating new table with created_at column');

        await dbRun(db, `
                CREATE TABLE projects_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_name TEXT UNIQUE NOT NULL,
                    last_number INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

        logger.info('Copying data from old table to new table');

        await dbRun(db, `
                INSERT INTO projects_new (id, project_name, last_number)
                SELECT id, project_name, last_number
                FROM projects
            `);

        logger.info('Dropping the old table');
        await dbRun(db, 'DROP TABLE projects');

        logger.info('Renaming new table to projects');

        await dbRun(db, 'ALTER TABLE projects_new RENAME TO projects');

        //commit transaction
        await dbRun(db, 'COMMIT');

        logger.info('Migration 2 completed: created_at column added successfully');
    } catch (error) {
        //rollback transaction
        logger.error('rollback transaction');
        await dbRun(db, 'ROLLBACK');
        throw error;
    }
}

/**
 * Main migration runner
 */

/**
 * Run all pending migrations
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 * @returns {Promise<number>} New version
 */

export async function runMigrations(db, logger) {
    logger.info('Starting database migrations...');

    try {
        await createMigrationsTable(db, logger);

        const currentVersion = await getCurrentVersion(db, logger);
        logger.info(`Current dbVersion: ${currentVersion}`);

        //apply migrations in order
        await applyMigration(
            db,
            logger,
            1,
            'Create initial projects table',
            migration0001_createProjectsTable
        );

        //future migrations to be added here
        await applyMigration(
            db,
            logger,
            2,
            'Add the CreatedAt field for projects',
            migration0002_addCreatedAt
        );

        const newVersion = await getCurrentVersion(db, logger);

        if (newVersion > currentVersion) {
            logger.info(`Database migrated from version ${currentVersion} to ${newVersion}`);
        } else {
            logger.info('Database is up-to-date');
        }

        return newVersion;
    } catch (error) {
        logger.error('Migration failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Get migration history
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 * @returns {Promise<Array>}
 */

export async function getMigrationHistory(db, logger) {
    try {
        const migrations = await dbAll(
            db,
            'SELECT version, description, applied_at FROM migrations ORDER BY version'
        );

        return migrations || [];
    } catch (error) {  
        if (error.message && error.message.includes('no such table')) {
            logger.debug('Migrations table does not exist yet (first run)');
            return [];
        }

        logger.error(`Error fetching migrations list ${error.message}`);
        throw error;
    }
}

/**
 * Display migration status (for CLI scripts)
 * @param {sqlite3.Database} db
 * @param {winston.Logger} logger
 */

export async function  showMigrationStatus(db, logger) {
    try {
        const currentVersion = await getCurrentVersion(db, logger);
        const history = await getMigrationHistory(db, logger);

        console.log(`Current version: ${currentVersion}`);
        console.log(`\nMigration History:\n`);

        if (history.length === 0) {
            console.log('No migrations applied yet');
        } else {
            history.forEach(m => {
                console.log(`[${m.version} ${m.description}] applied at: ${m.applied_at}`);
            })
        }
    } catch (error) {

            console.error('Error showing migration status\n');
            console.error('Error:', error.message);
            console.error(`\nStack trace: ${error.stack}`);
            throw error;
        }
}