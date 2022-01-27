'use strict'

const MINE = '💣';
const MARK = '🚩'
const EMPTY = ' ';

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;

var gBoard;
var gLevel;
var gGame;

function initGame() {

    var boardSize = getBoardSize();
    gLevel = {
        SIZE: boardSize,
        MINES: getNumOfMines(boardSize)
    };

    gGame = {
        isOn: false,
        isFirstClick: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };

    document.querySelector('.game-over').classList.add('hidden'); // hides game over message on new game

    buildBoard();
    renderBoard(gBoard, '.game-container', 'hidden-td', 1);
}

function buildBoard() {
    gBoard = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        gBoard[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            gBoard[i][j] = createCell();
        }
    }
}

function createCell() {
    return {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false
    };
}

// places the mines on random positions on the board except at gBoard[i][j]
function placeMines(numOfMines, i, j) {
    for (var idx = 0; idx < numOfMines; idx++) {

        var pos = getRandomPos(gBoard);
        while (pos.i === i && pos.j === j || gBoard[pos.i][pos.j].isMine) pos = getRandomPos(gBoard);
        gBoard[pos.i][pos.j].isMine = true;

        getBoardElementByPos(pos).classList.add('mines'); // problem, mines can be seen on user console - change to internal array of mines
    }
}

function cellClicked(mouseEvent, elCell, i, j) {
    if (mouseEvent.button !== RIGHT_CLICK && mouseEvent.button !== LEFT_CLICK) return;

    if (gGame.isFirstClick) startGame(i, j);

    if (!gGame.isOn) return;

    var cell = gBoard[i][j];
    if (!cell.isShown) {
        switch (mouseEvent.button) {
            case LEFT_CLICK:
                handleLeftClick(elCell, i, j);
                break;
            case RIGHT_CLICK:
                handleRightClick(elCell, cell);
                break;
        }
    }
}

function handleLeftClick(elCell, i, j) {
    var cell = gBoard[i][j];
    if (cell.isMarked) return;

    if (!cell.isMine) {
        openCell(i, j, elCell);
        if (cell.minesAroundCount === 0) expandShown(i, j);
        if (checkGameOver()) gameOver(true);
    } else {
        openMine(elCell);
    }
}

function handleRightClick(elCell, cell) {
    cell.isMarked = !cell.isMarked;
    gGame.markedCount += cell.isMarked ? 1 : -1;
    elCell.classList.toggle("marked");
    renderCell(elCell, cell.isMarked ? MARK : EMPTY)

    if (checkGameOver()) gameOver(true);
}

// i,j for the first click on the game
function startGame(i, j) {
    gGame.isOn = true;
    gGame.isFirstClick = false;
    // start timer here
    placeMines(gLevel.MINES, i, j);
    setMinesNegsCount();

}

function renderCell(elCell, value) {
    // Select the elCell and set the value
    elCell.innerHTML = `<span>${value}</span`;
}

function openMine(elMine) {
    renderCell(elMine, MINE);
    elMine.style.backgroundColor = 'red';
    revelAllMines();
    gameOver(false);
}

function gameOver(playerWin) {
    var elWinBox = document.querySelector('.game-over');
    var elWinMsg = elWinBox.querySelector('h1 span');

    if (playerWin) elWinMsg.innerHTML = 'Win';
    else elWinMsg.innerHTML = 'Lose';

    elWinBox.classList.remove('hidden');
    gGame.isOn = false;
}

function checkGameOver() { // check if there's a need to manually mark cells if player reveled all empty cells but did not mark mines
    return gGame.shownCount + gLevel.MINES === gLevel.SIZE ** 2 && gGame.markedCount === gLevel.MINES;
}

function revelAllMines() {
    var elMines = document.querySelectorAll('.mines');
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].classList.remove('hidden-td');
        renderCell(elMines[i], MINE);
    }
}

function openCell(i, j, elCell = undefined) {
    elCell = elCell ? elCell : getBoardElementByPos(createPos(i, j));
    elCell.classList.remove('hidden-td');

    var cell = gBoard[i][j];
    cell.isShown = true;
    gGame.shownCount++;

    var minesCount = cell.minesAroundCount;
    if (minesCount === 0) {
        minesCount = EMPTY;
    }

    renderCell(elCell, minesCount);
}

function expandShown(cellRowidx, cellCollIdx) {
    for (var i = cellRowidx - 1; i <= cellRowidx + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;

        for (var j = cellCollIdx - 1; j <= cellCollIdx + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) continue;
            if (i === cellRowidx && j === cellCollIdx) continue;

            if (gBoard[i][j].isMarked) continue;

            if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                openCell(i, j);
                if (gBoard[i][j].minesAroundCount === 0) expandShown(i, j);
            }
        }
    }
}

function setMinesNegsCount() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isMine) continue;
            gBoard[i][j].minesAroundCount = countNeighborMines(i, j);
        }
    }
}

function countNeighborMines(cellRowidx, cellCollIdx) {
    var count = 0;
    for (var i = cellRowidx - 1; i <= cellRowidx + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;

        for (var j = cellCollIdx - 1; j <= cellCollIdx + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) continue;
            if (i === cellRowidx && j === cellCollIdx) continue;
            if (gBoard[i][j].isMine) count++;
        }
    }
    return count;
}

function getBoardSize() {
    var difficultyBtns = document.getElementsByName('difficulty');
    for (var i = 0; i < difficultyBtns.length; i++) {
        if (difficultyBtns[i].checked) {
            return parseInt(difficultyBtns[i].value);
        }
    }
}

function getNumOfMines(boardSize) {
    switch (boardSize) {
        case 4: return 2;
        case 8: return 12;
        case 12: return 30;
        default: return parseInt((boardSize ** 2) * .2);
    }
}
