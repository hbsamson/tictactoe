const BASEGAME_API = "http://localhost:8080/tictactoe/tictactoeserver";
const WEBSERVICE_API = "http://localhost:8080/tictactoe-webservice/rest";

const BASEGAME_API_BASE = window.TICTACTOE_API_BASE || BASEGAME_API;
const WEBSERVICE_API_BASE = window.TICTACTOE_WEBSERVICE_API_BASE || WEBSERVICE_API;

export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

async function request(endpoint, params) {
    const url = new URL(`${BASEGAME_API_BASE}/${endpoint}`);
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
}

async function webserviceRequest(endpoint, options = {}) {
    const url = new URL(`${WEBSERVICE_API_BASE}/${endpoint}`);

    let response;
    try {
        response = await fetch(url, {
            method: options.method || "GET",
            headers: {
                Accept: "application/json",
                ...(options.body && {
                    "Content-Type": "application/json"
                })
            },
            ...(options.body && {
                body: JSON.stringify(options.body)
            })
        });
    } catch {
        throw new ApiError("The webservice API could not be reached. Kindly ensure that the webservice API is running and accessible.", 0);
    }

    const body = (await response.text()).trim();
    if (!response.ok) { throw new ApiError(body || `Server request failed (${response.status}).`, response.status); }
    return body;
}

async function saveRecord(record) {
    const url = new URL(`${WEBSERVICE_API_BASE}/game/save`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(record)
        });
        const body = (await response.text()).trim();
        if (!response.ok) throw new ApiError(body || `Server request failed (${response.status}).`, response.status);
        return body;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError("The webservice API could not be reached. Kindly ensure that the webservice API is running and accessible.", 0);
    }
}

export const gameRecordApi = {
    save: saveRecord,
    listGames: (playerId) => webserviceRequest(`game/list-games/${playerId}`),
    getGame: (gameId) => webserviceRequest(`game/${gameId}`)
};
