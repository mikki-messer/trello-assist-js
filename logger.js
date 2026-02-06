const winston = require('winston');

const isProduction = process.env.NODE_ENV === process.env.PRODUCTION_ENV_NAME;
const isDevelopment = !isProduction;

//Console output format

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: process.env.LOGS_TIMESTAMP_FORMAT }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta}) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        //adding metadata if exists
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }

        return msg;
    })
);

///format for files
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

//creating transposrts devending on the environment
const transports = [];

//console transport is present always 
transports.push(
    new winston.transports.Console({
        format: isProduction ? fileFormat : consoleFormat,
        //in production - plain JSON 
        //in development - colorized
    })
);

if (isDevelopment) {
    transports.push(
        new winston.transports.File({
            filename: process.env.LOG_ERROR_FILE_NAME,
            level: process.env.LOG_ERROR_LEVEL,
            format: fileFormat,
            maxsize: process.env.MAX_LOG_SIZE,
            maxFiles: process.env.MAX_FILE_NUMBER
        })
    );

    transports.push(
        new winston.transports.File({
            filename: process.env.LOG_COMBINED_FILE_NAME,
            format: fileFormat,
            maxsize: process.env.MAX_LOG_SIZE,
            maxFiles: process.env.MAX_FILE_NUMBER
        })
    );
}

//create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: transports,
    //don't exit on logging errors
    exitOnError: false
});

// Information about the mode on launch
if (isDevelopment) {
    logger.info('Logger initialized', {
        mode: 'development',
        transports: ['console', 'files'],
        logDir: 'logs/'
    });
} else {
    logger.info('Logger initialized', {
            mode: 'production',
            transports: ['console (stdout)'],
            note: 'Logs are sent to stdout for container logging'
    });
}

module.exports = logger;