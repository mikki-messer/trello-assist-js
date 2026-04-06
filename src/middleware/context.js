/**
 * Context middleware
 * Adds logger and db instances to request object
 * 
 * This middleware makes logger and db available to all handlers
 * via req.logger and req.db, avoiding global dependencies
 * 
 * @param {winston.Logger} logger - Logger instance
 * @param {sqlite3.Database} db - Database instance
 * @returns {Function} Express middleware function
 */
export function contextMiddleware(logger, db) {
    // Возвращаем middleware функцию
    return (req, res, next) => {
        // Добавляем logger в request
        req.logger = logger;
        
        // Добавляем db в request
        req.db = db;
        
        // Передаём управление следующей middleware или handler
        next();
    };
}