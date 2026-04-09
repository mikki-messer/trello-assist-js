export function handleRootGet(req, res) {
    const { logger } = req;

    logger.info(`Get request received for the root`);

    res.status(200).send('It\'s alive!');
}