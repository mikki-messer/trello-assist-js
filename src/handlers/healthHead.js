import { dbGet } from '../db.js';

export async function handleHealthHead(res, req) {
        //easy check
        const { logger, db } = req;
        try {
            logger.info(`Get health request received for ${process.env.APP_HEALTHCHECK_PATH}`);
    
            await dbGet(db, 'SELECT 1');
            res.status(200).end();
        } catch (error) {
            logger.error('Health check failed:', { 
                message: error.message
             });
            res.status(503).end();
        }
}