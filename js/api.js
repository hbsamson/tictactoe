const API_BASE =
    "http://localhost:8080/tictactoe/tictactoeserver";

async function createGame(key) {
    const response = await fetch(
        `${API_BASE}/createGame?key=${encodeURIComponent(key)}`
    );

    return response.text();
}

async function checkGame(key) {
    const response = await fetch(
        `${API_BASE}/check?key=${encodeURIComponent(key)}`
    );

    return Boolean(response.text());
}

async function getBoard(key) {
    const response = await fetch(
        `${API_BASE}/board?key=${encodeURIComponent(key)}`
    );

    return response.text();
}

async function makeMove(key, tile, x, y) {
    const response = await fetch(
        `${API_BASE}/move?key=${encodeURIComponent(key)}&tile=${tile}&y=${y}&x=${x}`
    );

    return response.text();
}

async function resetGame(key) {
    const response = await fetch(
        `${API_BASE}/reset?key=${encodeURIComponent(key)}`
    );

    return response.text();
}