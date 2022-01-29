'use strict'

const MINE = '💣';
const MARK = '🚩'
const LIFE = '❤'
const EMPTY = ' ';
const SMILEY_FACES = ['😀', '😨', '🤯', '😎'];

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
        secsPassed: -1
    };

    updateLivesHtml();
    updateSmileyFace(0);

    // resets for new game
    clearInterval(gTimerInterval); // in case new game starts before the old one ended
    gElTime = document.querySelector('.timer')
    updateTimer();

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

// i,j for the first click on the game
function startGame(i, j) {
    gGame.isOn = true;
    gGame.isFirstClick = false;

    updateTimer();
    gTimerInterval = setInterval(updateTimer, 1000);

    placeMines(gLevel.MINES, i, j);
    setMinesNegsCount();
}

function handleLeftClick(elCell, i, j) {
    var cell = gBoard[i][j];
    if (cell.isMarked) return;

    if (!cell.isMine) {
        openCell(i, j, elCell);
        if (cell.minesAroundCount === 0) expandShown(i, j);
        updateSmileyFace(0);
    } else {
        updateSmileyFace(1);
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

function openMine(i, j, elMine) {
    renderCell(elMine, MINE);
    elMine.style.backgroundColor = '#B33951';
    elMine.classList.remove('hidden-td');
    gBoard[i][j].isShown = true;
    gGame.shownCount++;
    gGame.lives--;
    updateLivesHtml();
}

function handleRightClick(elCell, cell) {
    cell.isMarked = !cell.isMarked;
    gGame.markedCount += cell.isMarked ? 1 : -1;
    elCell.classList.toggle('marked');
    renderCell(elCell, cell.isMarked ? MARK : EMPTY)
}


function checkGameOver() {
    var livesUsed = NUM_OF_LIVES - gGame.lives;
    var playerWinningCondition = gGame.shownCount + (gLevel.MINES - livesUsed) === gLevel.SIZE ** 2 && (gGame.markedCount + livesUsed) === gLevel.MINES;
    return gGame.lives <= 0 || playerWinningCondition;
}

function gameOver() {
    if (gGame.lives <= 0) {
        updateSmileyFace(2);
        revealMines();
    } else updateSmileyFace(3);

    gGame.isOn = false;
    clearInterval(gTimerInterval);
}

function revealMines() {
    var minesReveled = 0;
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isMine) {
                var elMine = getBoardElementByPos(createPos(i, j));
                elMine.classList.remove('hidden-td');
                renderCell(elMine, MINE);
                minesReveled++;

                if (minesReveled === gLevel.MINES) return;
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

function updateSmileyFace(idx) {
    var elSmiley = document.querySelector('.smiley');
    renderCell(elSmiley, SMILEY_FACES[idx]);
}

function updateLivesHtml() {
    var elLives = document.querySelector('.lives');
    renderCell(elLives, LIFE.repeat(gGame.lives));

    return gGame.lives;
}

function updateTimer() {
    gGame.secsPassed++;
    var timeStr = `${Math.floor(gGame.secsPassed / 60)}:${padSeconds(gGame.secsPassed % 60)}`;
    renderCell(gElTime, timeStr);
}

function padSeconds(seconds) {
    return seconds < 10 ? `0${seconds}` : seconds
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
