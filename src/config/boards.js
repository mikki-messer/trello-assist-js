let boards = {};

try {
    const localConfig = await import('./boards.local.js'); 
    boards = localConfig.default || {};

    const boardCount = Object.keys(boards).length;

    if (boardCount === 0) {
        console.warn('boards.local.js contains no boards');
    } else {
        console.log(`${boardCount} board(s) loaded from boards.local.js`);
    }

} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error(`boards.local.js not found! You can create it from boards.example.js`);
    } else {
        console.error('Error loading boards.local.js:', error.message);
    }
}

//checking if the board is registered
function isBoardRegistered(boardId){
    return boardId in boards;
}

//return board description
function getBoardDescription(boardId) {
    return boards[boardId] || `Unknown BoardId ${boardId}`;
}

//get the list of all boards
function getAllBoards(){
    return Object.keys(boards);
}

function getBoardCount(){
    return Object.keys(boards).length;
}

export {
    isBoardRegistered,
    getBoardDescription,
    getAllBoards,
    getBoardCount
}

