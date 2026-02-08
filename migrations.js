const logger = require('./logger');
const { dbRun, dbGet, dbAll } = require('./db');
const { log } = require('winston');

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
 */

async function createMigrationsTable() {
    await dbRun(`
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
 * @returns {Promise<number>} Current version (0 if no migrations applied)
 */

async function getCurrentVersion(){
    try {
        const result = await dbGet('SELECT MAX(version) as version FROM migrations');
        return result?.version || 0;
    } catch (error) {
        // Table doesn't exist yet
        return 0;
    }
}

/** 
 * Get current database version
 * @returns {Promise<number>} Current version (0 if no migrations applied)
 */

async function getCurrentVersion() {
    try {
        const result = await dbGet('SELECT MAX(version) as version FROM migrations');
        return result?.version || 0;
    } catch (error) {
        //table doesn't exist
        return 0;
    }
}

/**
 * Check if migration was already applied
 * @param {number} version - Migration version
 * @returns {Promise<boolean>}
 */

async function isMigrationApplied(version) {
    const currentVersion = await getCurrentVersion();
    return currentVersion >= version;    
}

/**
 * Record migration to database2
 * @param {number} version - Migration version
 * @param {string} description - Migration description
 */

async function recordMigration(version, description) {
    await dbRun(
        'INSERT INTO migrations (version, description) VALUES (?, ?)',
        [version, description]
    );
}

/**
 * Apply a single migration
 * @param {number} version - Migration version
 * @param {string} description - Migration description
 * @param {Function} upFunction - Function to execute migraton
 */

async function applyMigration(version, description, upFunction) {
    //checking if already applied
    if (await isMigrationApplied(version)) {
        logger.debug(`Migration ${version} is already applied: ${description}`);
        return;
    }

    logger.info(`Applying migration ${version}: ${description}`);

    try {
        //execute migration
        await upFunction();

        //record to the migrations table
        await recordMigration(version, description);

        logger.info(`Migration ${version} applied successfully`);
    } catch (error) {
        logger.error(`Migration ${version} failed`, {
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Migration ${version} failed ${error.message}`);
    }
}

/**
 * Migration 1: Create initial projects table
 */

async function migration0001_createProjectsTable() {
    await dbRun(`
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
 */

async function migration002_addCreatedAt() {
    // Check if column already exists
    const tableInfo = await dbAll ('PRAGMA table_info(projects)');
    const hasCreatedAt = tableInfo.some(col => col.name === 'created_at');

    if (hasCreatedAt) {
        logger.info('Column created_at already exists, skipping the migration');
        return;
    }

    await dbRun('BEGIN TRANSACTION');

    try {
        //recreating the table
        logger.info('Creating new table with created_at column');

        await dbRun(`
                CREATE TABLE projects_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_name TEXT UNIQUE NOT NULL,
                    last_number INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

        logger.info('Copying data from old table to new table');

        await dbRun(`
                INSERT INTO projects_new (id, project_name, last_number)
                SELECT id, project_name, last_number
                FROM projects
            `);

        logger.info('Dropping the old table');
        await dbRun('DROP TABLE projects');

        logger.info('Renaming new table to projects');

        await dbRun('ALTER TABLE projects_new RENAME TO projects');

        //commit transaction
        dbRun('COMMIT');

        logger.info('Migration 2 completed: created_at column added successfully');
    } catch (error) {
        //rollback transaction
        logger.error('rollback transaction');
        await dbRun('ROLLBACK');
        throw error;
    }
}

/**
 * Main migration runner
 */

/** Run all pending migrations */

async function runMigrations() {
    logger.info('Starting database migrations...');

    try {
        await createMigrationsTable();

        const currentVersion = await getCurrentVersion();
        logger.info(`Current dbVersion: ${currentVersion}`);

        //apply migrations in order
        await applyMigration(
            1,
            'Create initial projects table',
            migration0001_createProjectsTable
        );

        //future migrations to be added here
        await applyMigration(
            2,
            'Add the CreatedAt field for projects',
            migration002_addCreatedAt
        );

        const newVersion = await getCurrentVersion();

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
 * @returns {Promise<Array>} List of applied migrations
 */

async function getMigrationHistory() {
    try {
        const migrations = await dbAll(
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
 * Display migration status
 */

async function  showMigrationStatus() {
    try {
        const currentVersion = await getCurrentVersion();
        const history = await getMigrationHistory();

        console.log(`Current version: ${currentVersion}`);
        console.log(`\nMigration History:\n`);

        if (history.length === 0) {
            console.log('No migrations applied yet');
        } else {
            history.forEach(m => {
                console.log(`[${m.version} ${m.description}] applied at: ${m.applied_at}`);
            })
        }
    } catch (eror) {

            console.error('Error showing migration status\n');
            console.error('Error:', error.message);
            console.error(`\nStack trace: ${error.stack}`);
            throw error;
        }
}

module.exports = {
    runMigrations,
    getCurrentVersion,
    getMigrationHistory,
    showMigrationStatus
};