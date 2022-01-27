'use strict'

const MINE = '💣';
const MARK = '🚩'
const EMPTY = ' ';

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;

const NUM_OF_LIVES = 3;

var gBoard;
var gLevel;
var gGame;

var gTimerInterval;
var gElTime;

function initGame() {

    var boardSize = getBoardSize();
    gLevel = {
        SIZE: boardSize,
        MINES: getNumOfMines(boardSize)
    };

    gGame = {
        isOn: false,
        isFirstClick: true,
        lives: NUM_OF_LIVES,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };

    // resets for new game
    document.querySelector('.game-over').classList.add('hidden'); // will not be needed when smily is added
    document.querySelector('.lives span').innerHTML = NUM_OF_LIVES;
    clearInterval(gTimerInterval);
    gElTime = document.querySelector('.timer span')
    gElTime.innerHTML = 0;

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
        if (checkGameOver()) gameOver();
    }
}

function handleLeftClick(elCell, i, j) {
    var cell = gBoard[i][j];
    if (cell.isMarked) return;

    if (!cell.isMine) {
        openCell(i, j, elCell);
        if (cell.minesAroundCount === 0) expandShown(i, j);
    } else {
        openMine(i, j, elCell);
    }
}

function openCell(i, j, elCell = undefined) {
    elCell = elCell ? elCell : getBoardElementByPos(createPos(i, j));
    elCell.classList.remove('hidden-td');

    var cell = gBoard[i][j];
    cell.isShown = true;
    gGame.shownCount++;

    var minesCount = cell.minesAroundCount ? cell.minesAroundCount : EMPTY;

    renderCell(elCell, minesCount);
}

function openMine(i, j, elMine) { // problem with last item being a mine and the last life
    renderCell(elMine, MINE);
    elMine.style.backgroundColor = 'red';
    elMine.classList.remove('hidden-td');
    gBoard[i][j].isShown = true;
    gGame.shownCount++;
    updateLives();
}

function handleRightClick(elCell, cell) {
    cell.isMarked = !cell.isMarked;
    gGame.markedCount += cell.isMarked ? 1 : -1;
    elCell.classList.toggle('marked');
    renderCell(elCell, cell.isMarked ? MARK : EMPTY)
}

// i,j for the first click on the game
function startGame(i, j) {
    gGame.isOn = true;
    gGame.isFirstClick = false;

    updateTimer();
    gTimerInterval = setInterval(updateTimer, 1000);

    placeMines(gLevel.MINES, i, j);
    setMinesNegsCount();
}

function renderCell(elCell, value) {
    // Select the elCell and set the value
    elCell.innerHTML = `<span>${value}</span>`; // span not needed currently
}

function gameOver() {
    var elWinBox = document.querySelector('.game-over');
    var elWinMsg = elWinBox.querySelector('h1 span');

    if (gGame.lives > 0) elWinMsg.innerHTML = 'Win';
    else elWinMsg.innerHTML = 'Lose';

    elWinBox.classList.remove('hidden');
    //All the above should be deleted if simley exists

    if (gGame.lives <= 0) {
        revelAllMines();
    }
    gGame.isOn = false;
    clearInterval(gTimerInterval);
}

function checkGameOver() {
    var livesUsed = NUM_OF_LIVES - gGame.lives;
    var playerWinningCondition = gGame.shownCount + (gLevel.MINES - livesUsed) === gLevel.SIZE ** 2 && (gGame.markedCount + livesUsed) === gLevel.MINES;
    return gGame.lives <= 0 || playerWinningCondition;
}

function revelAllMines() {
    var elMines = document.querySelectorAll('.mines');
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].classList.remove('hidden-td');
        renderCell(elMines[i], MINE);
    }
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

function updateLives() {
    gGame.lives--;
    var elLives = document.querySelector('.lives span');
    renderCell(elLives, gGame.lives);

    return gGame.lives;
}

function updateTimer() {
    gGame.secsPassed++;
    renderCell(gElTime, gGame.secsPassed);
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

