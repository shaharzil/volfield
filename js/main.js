const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 20;
var gBoard;
var gHero = {};
var exitIdxs = [];
var gFoundMonster = false;
var mat;
var gMonsters = [];
var gMonsterInterval;
var gState = { score: 0, safeCount: 0, dest: 625, isGameOn: true, checkedCount: 0 };
var gTempScore = 0;

function init() {
    gHero = { currLocation: { i: 0, j: 1 } };
    gMonsters.push({ currLocation: { i: 15, j: 15 } });
    // gMonsters.push({ currLocation: { i: 10, j: 10 } });
    // gMonsters.push({ currLocation: { i: 40, j: 20 } });
    gBoard = buildBoard();
    checkVictory()
    gMonsterInterval = setInterval(moveMonsters, 1000);
    drawBoard(gBoard);
}

function moveMonsters() {
    var diifs = [{i: 0, j: 1}, {i: 0, j: -1}, {i: 1, j: 0}, {i: -1, j: 0}]
    gMonsters.forEach(monster => {
        var randIdx = getRandomIntInclusive(0, 3)
        var randDiff = diifs[randIdx]
        var nextLocation = {i: monster.currLocation.i + randDiff.i, j: monster.currLocation.j + randDiff.j}
        if (nextLocation.i < 0 || nextLocation.i > gBoard.length - 1 || nextLocation.j < 0 || nextLocation.j > gBoard.length -1) return
        // if (!gBoard[nextLocation.i][nextLocation.j]) console.log(nextLocation)
        while (gBoard[nextLocation.i][nextLocation.j].status === 'safe') {
            var randIdx = getRandomIntInclusive(0, 3)
            var randDiff = diifs[randIdx]
            var nextLocation = {i: monster.currLocation.i + randDiff.i, j: monster.currLocation.j + randDiff.j}
        }
        gBoard[monster.currLocation.i][monster.currLocation.j].gameElement = 'floor';
        monster.currLocation = { i: nextLocation.i, j: nextLocation.j };
        gBoard[nextLocation.i][nextLocation.j].gameElement = 'monster';
        if (gBoard[nextLocation.i][nextLocation.j].status === 'pending') gameOver();
    });
    drawBoard(gBoard);
}

function gameOver() {
    gState.isGameOn = false;
    console.log('lose');
    gBoard.forEach(row => {
        row.forEach(cell => {
            if (cell.status === 'pending' && cell.gameElement === 'hero') {
                cell.status = 'empty';
                cell.gameElement = 'floor';
            }
        });
    });
    clearInterval(gMonsterInterval);
    drawBoard(gBoard);
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function buildBoard() {
    var mat = [];
    var SIZE = 25;
    for (let i = 0; i < SIZE; i++) {
        mat[i] = [];
        for (let j = 0; j < SIZE; j++) {
            mat[i][j] = { status: 'empty', gameElement: 'floor' };
            if (i === 0 || i === SIZE - 1 || j === 0 || j === SIZE - 1) {
                mat[i][j] = { status: 'safe', gameElement: 'safeZone' };
                gState.safeCount++;
            }
            if (i === gHero.currLocation.i && j === gHero.currLocation.j) {
                mat[i][j].gameElement = 'hero';
            }
        }
    }
    return mat;
}

function drawBoard(board) {
    var currColor;
    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            // console.log(cell)
            if (cell.gameElement === 'floor') {
                currColor = '#42b4e6'
            } else if (cell.gameElement === 'safeZone') {
                var img = new Image();
                img.src = "img/wall.jpg";
                ctx.drawImage(img, j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                return
            } else if (cell.gameElement === 'monster') {
                var img = new Image();
                img.src = "img/dinosaur.png";
                ctx.drawImage(img, j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                return
                // currColor = 'red'
            }
            else if (cell.status === 'pending') {
                currColor = 'white'
            }
            if (i === gHero.currLocation.i && j === gHero.currLocation.j) {
                var img = new Image();
                img.src = "img/hero.png";
                ctx.drawImage(img, j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                return
            }
            ctx.fillStyle = currColor;
            ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });
    });
}

function moveHero(ev) {
    if (!gState.isGameOn) return;
    var keyCode = ev.keyCode;
    // if (Math.abs(keyCode - gHero.keyCode) === 2 && gBoard[gHero.currLocation.i][gHero.currLocation.j].gameElement !== 'safeZone') return
    gHero.keyCode = keyCode
    var nextLocation = { i: gHero.currLocation.i, j: gHero.currLocation.j };
    if (nextLocation.i < 0 || nextLocation.i === gBoard.length || nextLocation.j < 0 || nextLocation.j === gBoard.length)
        return;
    switch (keyCode) {
        case 40:
            nextLocation.i++;
            break;
        case 39:
            nextLocation.j++;
            break;
        case 38:
            nextLocation.i--;
            break;
        case 37:
            nextLocation.j--;
            break;
        default:
            break;
    }
    if (nextLocation.i < 0 || nextLocation.i === gBoard.length || nextLocation.j < 0 || nextLocation.j === gBoard.length) return;
    var nextCell = gBoard[nextLocation.i][nextLocation.j]
    var currCell = gBoard[gHero.currLocation.i][gHero.currLocation.j]
    if (nextCell.gameElement === 'monster' || nextCell.status === 'pending') {
        gameOver();
        return;
    }

    if (nextCell.status === 'empty' && currCell.status === 'safe') {
        exitIdxs = [{ i: nextLocation.i, j: nextLocation.j, keyCode }]
    }
    if (nextCell.status === 'safe' && currCell.status !== 'safe') {
        closeArea(exitIdxs);
        gBoard[nextLocation.i][nextLocation.j].gameElement = 'hero'

    }
    nextCell.gameElement = 'hero';
    if (nextCell.status === 'empty') {
        nextCell.status = 'pending';
    }
    if (currCell.status === 'safe') {
        currCell.gameElement = 'safeZone';
    }
    var negsCount = countNegs(nextLocation.i, nextLocation.j)
    if (negsCount >= 2) exitIdxs.push({ i: nextLocation.i, j: nextLocation.j, keyCode })
    
    gHero.currLocation = nextLocation;
    checkVictory();
    drawBoard(gBoard);
}

function closeArea(exitIdxs) {
    exitIdxs.forEach(exitIdx => {

        var expendFrom = JSON.parse(JSON.stringify(exitIdx));
        var expendFrom2 = JSON.parse(JSON.stringify(exitIdx));

        if (exitIdx.keyCode === 40 || exitIdx.keyCode === 38) {
            expendFrom.j++
            expendFrom2.j--
            while (gBoard[expendFrom.i][expendFrom.j].status === 'pending') {
                expendFrom.j++
            }
            while (gBoard[expendFrom2.i][expendFrom2.j].status === 'pending') {
                expendFrom2.j--
            }
        }
        if (exitIdx.keyCode === 37 || exitIdx.keyCode === 39) {
            expendFrom.i++
            expendFrom2.i--;
            while (gBoard[expendFrom.i][expendFrom.j].status === 'pending') {
                expendFrom.i++;
            }
            while (gBoard[expendFrom2.i][expendFrom2.j].status === 'pending') {
                expendFrom2.i--;
            }
        }
        mat = JSON.parse(JSON.stringify(gBoard));
        expendSafeZone(mat, expendFrom.i, expendFrom.j);
        if (!gFoundMonster) {
            gBoard = mat
            gState.safeCount += gTempScore;
        }
        gTempScore = 0;
        gFoundMonster = false
        mat = JSON.parse(JSON.stringify(gBoard));
        expendSafeZone(mat, expendFrom2.i, expendFrom2.j);
        if (!gFoundMonster) {
            gState.safeCount += gTempScore;
            gBoard = mat
            gTempScore = 0;
        } else {
            gTempScore = 0;
            mat = JSON.parse(JSON.stringify(gBoard));
            expendPending(mat, exitIdx.i, exitIdx.j);
            gState.safeCount += gTempScore;
            gBoard = mat
        }
        gTempScore = 0;

        gFoundMonster = false
        gTempScore = 0;
    })
}


function expendSafeZone(mat, rowIdx, colIdx) {

    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i < 0 || i >= 50 || j < 0 || j >= 50) return;
            if (mat[i][j].gameElement === 'monster') {
                gFoundMonster = true;
            }
            if (mat[i][j].status === 'empty') {
                mat[i][j] = { status: 'safe', gameElement: 'safeZone' };
                gTempScore++;
                expendSafeZone(mat, i, j);
            } else if (mat[i][j].status === 'pending') {
                // mat[i][j] = { status: 'safe', gameElement: 'safeZone' };
                expendPending(mat, i, j);
            }
        }
    }
}

function expendPending(mat, rowIdx, colIdx) {
    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i < 0 || i >= 50 || j < 0 || j >= 50) return;
            if (mat[i][j].status === 'pending') {
                // gState.safeCount++
                gTempScore++;
                gBoard[i][j].isChecked = true
                mat[i][j] = { status: 'safe', gameElement: 'safeZone' };
                expendPending(mat, i, j);
            }
        }
    }
}

function countNegs(rowIdx, colIdx) {
    var negsCount = 0
    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i < 0 || i >= gBoard.length || j < 0 || j >= gBoard[0].length) continue;
            if (i === rowIdx && j === colIdx) continue
            if (gBoard[i][j].status === 'pending') negsCount++
        }
    }
    return negsCount
}

function checkVictory() {
    var score = ((gState.safeCount - 96) * 100) / (gState.dest - 96)
    var elScore = document.querySelector('.score')
    elScore.innerText = score + '%'
    if ((gState.safeCount * 100) / gState.dest >= 70) {
        // console.log('victory', (gState.safeCount * 100) / gState.dest);
    }
}
