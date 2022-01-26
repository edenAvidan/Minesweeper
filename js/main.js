'use strict'

const MINE = '💣';
const MARK = '🚩'
const EMPTY = ' ';

var gBoard;
var gLevel;
var gGame;

function initGame() {
    gLevel = {
        SIZE: 4,
        MINES: 2
    };

    gGame = {
        isOn: false,
        isFirstClick: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };

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

// places the mines on random positions on the board except at gBoard[i][j]
function placeMines(numOfMines, i, j) {
    for (var k = 0; k < numOfMines; k++) {
        var pos = getRandomPos(gBoard);
        while (pos.i === i && pos.j === j || gBoard[pos.i][pos.j].isMine) pos = getRandomPos(gBoard);
        gBoard[pos.i][pos.j].isMine = true;
        getBoardElementByPos(pos).classList.add('mines'); // problem, mines can be seen on user console
    }
}

function cellClicked(elCell, i, j) {
    if (gGame.isFirstClick) startGame(i, j);

    if (!gGame.isOn) return;

    var cell = gBoard[i][j];
    if (cell.isMarked) return;
    if (!cell.isShown) {
        if (!cell.isMine) {
            openCell(i, j, elCell);
            if (cell.minesAroundCount === 0) openNeighborCells(i, j);
            if (isPlayerWon()) gameOver(true);
        } else {
            openMine(elCell);
        }
    }
}

function cellRightClicked(elCell, i, j) {
    if (gGame.isFirstClick) startGame(i, j);

    if (!gGame.isOn) return;

    var cell = gBoard[i][j];
    if (!cell.isShown) {
        cell.isMarked = !cell.isMarked;
        gGame.markedCount += cell.isMarked ? 1 : -1;
        elCell.classList.toggle("marked");
        renderCell(undefined, cell.isMarked ? MARK : EMPTY, elCell)

        if (isPlayerWon()) gameOver(true);
    }
}

// i,j for the first click on the game
function startGame(i, j) {
    gGame.isOn = true;
    gGame.isFirstClick = false;
    // start timer here
    placeMines(gLevel.MINES, i, j);
    setMinesNegsCount();

}

function renderCell(location, value, elCell = undefined) {
    // Select the elCell and set the value
    elCell = elCell ? elCell : getBoardElementByPos(location);
    elCell.innerHTML = `<span>${value}</span`;
}

function openMine(elMine) {
    renderCell(undefined, MINE, elMine);
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

function isPlayerWon() {
    return gGame.shownCount + gLevel.MINES === gLevel.SIZE ** 2 && gGame.markedCount === gLevel.MINES;
}

function revelAllMines() {
    var elMines = document.querySelectorAll('.mines');
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].classList.remove('hidden-td');
        renderCell(undefined, MINE, elMines[i])
    }
}

function openCell(i, j, elCell = undefined) {
    elCell = elCell ? elCell : getBoardElementByPos(getPos(i, j));
    elCell.classList.remove('hidden-td');

    var cell = gBoard[i][j];
    cell.isShown = true;
    gGame.shownCount++;

    var minesCount = cell.minesAroundCount;
    if (minesCount === 0) {
        minesCount = EMPTY;
    }

    renderCell(getPos(i, j), minesCount);
}

function openNeighborCells(cellRowidx, cellCollIdx) {
    for (var i = cellRowidx - 1; i <= cellRowidx + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;

        for (var j = cellCollIdx - 1; j <= cellCollIdx + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) continue;
            if (i === cellRowidx && j === cellCollIdx) continue;

            if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                openCell(i, j);
                if (gBoard[i][j].minesAroundCount === 0) openNeighborCells(i, j);
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

function createCell() {
    return {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false
    };
}