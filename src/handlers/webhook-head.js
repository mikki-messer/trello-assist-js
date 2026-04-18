export function handleWebhookHead (req, res) {
    const { logger } = req;

    logger.info('Health check requested');

    res.status(200).end();
}