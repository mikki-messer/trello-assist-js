import winston  from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

//create logger
const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            
            // Add stack trace for errors
            if (stack) {
                msg += `\n${stack}`;
            }
            
            // Add metadata if present
            if (Object.keys(meta).length > 0) {
                msg += ` ${JSON.stringify(meta)}`;
            }
            
            return msg;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

export default logger;