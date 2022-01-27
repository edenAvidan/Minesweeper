'use strict'

function renderBoard(mat, selector, classList = '', border = 0) {
    var strHTML = `<table border="${border}" oncontextmenu="return false;"><tbody>`;
    for (var i = 0; i < mat.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < mat[i].length; j++) {
            strHTML += `<td class="cell-${i}-${j} ${classList}" onmouseup="cellClicked(event, this, ${i}, ${j})"></td>`;
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function getRandomPos(mat) {
    return createPos(getRandomInt(0, mat.length), getRandomInt(0, mat[0].length));
}

function getBoardElementByPos(location) {
    return document.querySelector(`.cell-${location.i}-${location.j}`);
}

function renderCell(elCell, value) {
    elCell.innerHTML = value;
}

function createPos(i, j) {
    return {
        i: i,
        j: j
    };
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}