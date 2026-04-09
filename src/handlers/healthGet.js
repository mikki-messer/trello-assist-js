import { dbGet } from '../db.js';
import { getBoardCount } from '../config/boards.js';

export async function handleHealthGet(req, res) {
    const { logger, db } = req;
    try {
        //check DB
        await dbGet(db, 'SELECT 1');

        logger.info(`Get health request received for ${process.env.APP_HEALTHCHECK_PATH}`);

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: 'connected',
            boards_registered: getBoardCount()
        });

    } catch (error) {
        logger.error('Health check failed:', { 
            message: error.message
         });

        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}