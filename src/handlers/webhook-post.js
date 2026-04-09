import { 
    incrementProjectCounter,
} from '../db.js';
import { getProjectNameFromIdValue, updateCardTitle } from '../utils/trello-utils.js';
import { formatCardTitle } from '../utils/format.js';
import { isBoardRegistered, getBoardDescription, getAllBoards } from '../config/boards.js';

const CUSTOM_FIELD_NAME = process.env.TRELLO_CUSTOM_FIELD_NAME;
const EVENT_TYPE = process.env.TRELLO_EVENT_TYPE;

export async function handleWebhookPost(req, res) {
    const { logger, db } = req;

    const eventType = req.body.action?.type;
    const boardId = req.body.model?.id;
    const boardName = req.body.model?.name;

    logger.info('Webhook received!', {
        eventType,
        boardId,
        boardName
    });

    if (!isBoardRegistered(boardId)) {
        logger.warn('Webhook from unregistered board - ignored, add it to config/boards.js to enable it', {
            boardId,
            boardName,
            registeredBoards: getAllBoards()
        }); 
        return res.status(200).send('Webhook from unregistered board - ignored'); //200 to keep the endpoint alive
    }

    logger.info('Webhook from registered board', {
         boardId,
         description: getBoardDescription(boardId)
    });

    if (eventType === EVENT_TYPE) {
        try {
            const customField = req.body.action.data.customField;
            const customFieldItem = req.body.action.data.customFieldItem;
            const card = req.body.action.data.card;

            if (customField.name === CUSTOM_FIELD_NAME) {
                logger.info(`${CUSTOM_FIELD_NAME} field changed!`, { 
                    cardId: card.id,
                    cardName: card.name 
                });

                const projectName = await getProjectNameFromIdValue(
                    logger,
                    customField.id, 
                    customFieldItem.idValue);

                if (projectName) {
                    logger.info(`${CUSTOM_FIELD_NAME} resolved`, { projectName });

                    //increasing counter
                    const newNumber = await incrementProjectCounter(db, logger, projectName);
                    logger.info('Counter incremented', { 
                        projectName, 
                        newNumber });

                    //format new card title
                    const newTitle = formatCardTitle(projectName, newNumber, card.name);

                    //updating card title in Trello
                    await updateCardTitle(logger, card.id, newTitle);

                    logger.info('Card updated successfully', {
                        cardId: card.id,
                        oldTitle: card.name,
                        newTitle
                    });
                }
                
            }
        } catch (error) {
            logger.error('Error processing webhook:', {
                error: error.message,
                stack: error.stack,
                eventType,
                boardId 
            });

            return res.status(500).json({ 
                error: 'Internal server error' 
        });
        }
    }

    res.status(200).send('OK');   
}