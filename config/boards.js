let boards = {};
let configLoaded = false;

try {
    const localConfig = require('./boards.local');
    boards = localConfig.boards || {};
    configLoaded = true;

    const boardCount = Object.keys(boards).length;

    if (boardCount === 0) {
        console.warn('boards.local.js contains no boards');
    } else {
        console.log(`${boardCount} board(s) loaded from boards.local.js`);
    }

} catch (error) {
    if (error.code === 'MODULE_NOT_FOULD') {
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

//get all boards with descriptions
function getAllBoardsWithDescriptions() {
    return Object.entries(boards).map(([id, description]) => ({
        id,
        description
    }));
}

function getBoardCount(){
    return Object.keys(boards).length;
}

function isConfigLoaded() {
    return configLoaded;
}

//add board (for future)
function addBoard(boardId, description){
    boards[boardId] = description;
    console.log(`Board ${boardId} ${description} added successfully`);
}

//remove board (for future)
function removeBoard(boardId){
    if (boards[boardId]) {
        delete boards[boardId];
        console.log(`Board ${boardId} removed`);
        return true;
    }
    return false;
}

module.exports = {
    boards,
    isBoardRegistered,
    getBoardDescription,
    getAllBoards,
    getAllBoardsWithDescriptions,
    isConfigLoaded,
    getBoardCount,
    addBoard,
    removeBoard
}


