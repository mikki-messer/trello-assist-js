export function handleWebhookHead (req, res) {
    const { logger } = req;

    logger.debug('Health check requested');

    res.status(200).end();
}