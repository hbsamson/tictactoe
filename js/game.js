let gameKey = null;
let playerTile = null;
let boardPollingInterval = null;
let waitingInterval = null;
let waitingTimeout = null;

const WAITING_TIMEOUT = 30000; // 30 seconds
const WAITING_TIMEOUT_SECONDS = 30;

let gameStarted = false;
let gameFinished = false;

let currentTurn = "X";
let xScore = 0;
let oScore = 0;

const lobby = document.getElementById("lobby");
const waiting = document.getElementById("waiting");
const game = document.getElementById("game");
const waitingMessage = document.getElementById("waitingForPlayer");

const createButton = document.getElementById("createButton");
const joinButton = document.getElementById("joinButton");
const restartButton = document.getElementById("restartButton");

const gameKeyInput = document.getElementById("gameKey");
const displayKey = document.getElementById("displayKey");

const statusText = document.getElementById("status");

const cells = document.querySelectorAll(".cell");

createButton.addEventListener("click", async () => {
    const key = gameKeyInput.value.trim();

    if (!key) {
        showPopup("Please enter a game key.");
        return;
    }

    try {
        const result = await createGame(key);

        gameKey = key;
        playerTile = "X";

        lobby.hidden = true;
        game.hidden = false;
        // waiting.hidden = false;
        waitingForPlayer.hidden = false;

        displayKey.textContent = key;

        waitForOpponentToJoin();

    } catch (error) {
        console.error(error);
        showPopup("Unable to create game.");
    }
});

function waitForOpponentToJoin() {
    clearWaitingTimers();

    let secondsLeft = WAITING_TIMEOUT_SECONDS;

    waitingMessage.textContent =
        `Waiting for another player... (${secondsLeft}s)`;

    // API polling
    waitingInterval = setInterval(async () => {
        try {
            const status = await checkGame(gameKey);

            console.log("Game status:", status);

            if (status) {
                clearWaitingTimers();

                gameStarted = true;

                waiting.hidden = true;
                game.hidden = false;

                startBoardPolling();
            }
        } catch (error) {
            console.error(error);
        }
    }, 1000);

    // Countdown display
    waitingCountdownInterval = setInterval(() => {
        secondsLeft--;

        waitingMessage.textContent =
            `Waiting for another player... (${secondsLeft}s)`;

        if (secondsLeft <= 0) {
            clearInterval(waitingCountdownInterval);
            waitingCountdownInterval = null;
        }
    }, 1000);

    // Actual timeout
    waitingTimeout = setTimeout(() => {
        clearWaitingTimers();

        returnToLobby();

        showPopup(
            "Waiting time expired. Please create or join a game again."
        );
    }, WAITING_TIMEOUT_SECONDS * 1000);
}

function clearWaitingTimers() {
    if (waitingInterval) {
        clearInterval(waitingInterval);
        waitingInterval = null;
    }

    if (waitingTimeout) {
        clearTimeout(waitingTimeout);
        waitingTimeout = null;
    }
}

function returnToLobby() {
    stopBoardPolling();
    clearWaitingTimers();

    gameStarted = false;
    gameFinished = false;
    currentTurn = "X";

    gameKey = null;
    playerTile = null;

    cells.forEach(cell => {
        cell.textContent = "";
        cell.disabled = true;
    });

    gameKeyInput.value = "";
    displayKey.textContent = "";

    // waiting.hidden = true;
    game.hidden = true;
    lobby.hidden = false;
}

// start game from join
joinButton.addEventListener("click", async () => {
    const key = gameKeyInput.value.trim();

    if (!key) {
        showPopup("Please enter a game key.");
        return;
    }

    try {
        const result = await createGame(key);

        gameKey = key;
        playerTile = "O";

        gameStarted = true;
        lobby.hidden = true;
        game.hidden = false;
        // waiting.hidden = false;

        startBoardPolling();

    } catch (error) {
        console.error(error);
        showPopup("Unable to join game.");
    }
});

function startBoardPolling() {
    // Prevent multiple polling intervals
    if (boardPollingInterval) {
        clearInterval(boardPollingInterval);
    }

    refreshBoard();

    boardPollingInterval = setInterval(async () => {
        if (!gameStarted || gameFinished) {
            return;
        }

        await refreshBoard();
    }, 1000);
}

function stopBoardPolling() {
    if (boardPollingInterval) {
        clearInterval(boardPollingInterval);
        boardPollingInterval = null;
    }
}

// clickable cells
cells.forEach(cell => {
    cell.addEventListener("click", async () => {
        if (!gameStarted || gameFinished) {
            return;
        }

        if (currentTurn !== playerTile) {
            return;
        }

        if (cell.textContent.trim() !== "") {
            return;
        }

        const x = Number(cell.dataset.x);
        const y = Number(cell.dataset.y);

        try {
            await makeMove(
                gameKey,
                playerTile,
                x,
                y
            );

            currentTurn = playerTile === "X" ? "O" : "X";

            await refreshBoard();

        } catch (error) {
            console.error(error);
        }
    });
});

function parseBoard(boardString) {
    return boardString.split(":").slice(0, 9);
}

async function refreshBoard() {
    const boardString = await getBoard(gameKey);
    if (boardString === "[GAME NOT YET STARTED]" || boardString === "[EXIT]") {
        return;
    }
    const board = parseBoard(boardString);
    console.log("Board:", board);

    cells.forEach((cell, index) => {
        cell.textContent = board[index];
    });

    const winner = getWinner(board);

    if (winner) {
         if (winner === "X") {
            xScore++;
        } else {
            oScore++;
        }
        gameFinished = true;
        
        updateBoardInteractivity();
        stopBoardPolling();

        showPopup(
            winner === playerTile
                ? "You won!"
                : "You lost!"
        );

        await restartBoard();
        return;
    }

    // Check draw after checking winner
    if (isDraw(board)) {
        gameFinished = true;
        gameStarted = false;

        updateBoardInteractivity();
        stopBoardPolling();

        restartButton.hidden = true;

        await handleDraw();

        return;
    }

    // Only update turn if game is still ongoing
    currentTurn = determineCurrentTurn(board);
    updateBoardInteractivity();
}

function determineCurrentTurn(board) {
    let xCount = 0;
    let oCount = 0;

    for (const tile of board) {
        if (tile === "X") xCount++;
        if (tile === "O") oCount++;
    }

    return xCount === oCount ? "X" : "O";
}

function updateBoardInteractivity() {
    const isMyTurn = currentTurn === playerTile;

    cells.forEach(cell => {
        const isOccupied = cell.textContent.trim() !== "";

        cell.disabled = !isMyTurn || isOccupied || gameFinished;
    });

    statusText.textContent = isMyTurn
        ? "Your turn"
        : "Waiting for opponent...";
}

function getWinner(board) {
    const lines = [
        // rows
        [board[0], board[1], board[2]],
        [board[3], board[4], board[5]],
        [board[6], board[7], board[8]],

        // columns
        [board[0], board[3], board[6]],
        [board[1], board[4], board[7]],
        [board[2], board[5], board[8]],

        // diagonals
        [board[0], board[4], board[8]],
        [board[2], board[4], board[6]]
    ];

    for (const line of lines) {
        const [a, b, c] = line;

        if (a && a === b && b === c) {
            return a;
        }
    }

    return null;
}

function isDraw(board) {
    let turnCount = 0;

    for (const tile of board) {
        if (tile === "X" || tile === "O") {
            turnCount++;
        }
    }

    return turnCount === 9;
}

async function restartBoard() {
    try {
        if (playerTile === "X") {
            await resetGame(gameKey);
        }

        cells.forEach(cell => {
            cell.textContent = "";
            cell.disabled = true;
        });

        currentTurn = "X";

        statusText.textContent =
            playerTile === "X"
                ? "Your turn"
                : "Waiting for opponent...";

    } catch (error) {
        console.error("Unable to reset board:", error);
    }
}

async function handleDraw() {
    restartButton.hidden = true;

    for (let seconds = 3; seconds > 0; seconds--) {
        showPopup(`It's a draw! Restarting in ${seconds}...`);

        await new Promise(resolve =>
            setTimeout(resolve, 1000)
        );
    }

    await restartGame();
}

async function restartGame() {
    try {
        // SAME game key
        await resetGame(gameKey);

        cells.forEach(cell => {
            cell.textContent = "";
            cell.disabled = true;
        });

        gameFinished = false;
        gameStarted = true;
        currentTurn = "X";

        restartButton.hidden = true;

        closePopup();

        updateBoardInteractivity();
        startBoardPolling();

    } catch (error) {
        console.error("Unable to restart game:", error);
    }
}

function showPopup(message) {
    document.getElementById("modalMessage").textContent =
        message;

    document
        .getElementById("overlay")
        .classList.remove("hidden");
}

restartButton.addEventListener("click", async () => {
    restartButton.disabled = true;

    await clearBoardUI();

    restartButton.disabled = false;
});

function clearBoardUI() {
    cells.forEach(cell => {
        cell.textContent = "";
        cell.disabled = true;
    });

    currentTurn = "X";
}