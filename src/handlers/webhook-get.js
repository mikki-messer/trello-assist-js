const WEBHOOK_PATH = process.env.APP_WEBHOOK_PATH;

export function handleWebhookGet(req, res) {
    const { logger } = req;

    logger.debug(`Get request received for the ${WEBHOOK_PATH}`);

    res.status(200).send('Server is alive! Use POST to send data.');
}