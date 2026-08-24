const DEFAULT_API_BASE = "http://localhost:8080/tictactoe/tictactoeserver";
const API_BASE = window.TICTACTOE_API_BASE || DEFAULT_API_BASE;

export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

async function request(endpoint, params) {
    const url = new URL(`${API_BASE}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    let response;
    try {
        response = await fetch(url, { headers: { Accept: "text/plain" } });
    } catch {
        throw new ApiError("The game server could not be reached. Kindly ensure that the game server is running and accessible.", 0);
    }

    const body = (await response.text()).trim();
    if (!response.ok) throw new ApiError(body || `Server request failed (${response.status}).`, response.status);
    return body;
}

export const gameApi = {
    create: (key) => request("createGame", { key }),
    check: async (key) => (await request("check", { key })).toLowerCase() === "true",
    board: (key) => request("board", { key }),
    move: (key, tile, x, y) => request("move", { key, tile, y, x }),
    reset: (key) => request("reset", { key }),
    resetUrl: (key) => {
        const url = new URL(`${API_BASE}/reset`);
        url.searchParams.set("key", key);
        return url.toString();
    }
};
