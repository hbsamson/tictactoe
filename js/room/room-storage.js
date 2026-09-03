import { KEY_PATTERN, PLAYER_AVATARS } from "../config.js";

const CHEER_STORAGE_PREFIX = "tictactoe:cheers:";
const SCORE_STORAGE_PREFIX = "tictactoe:scores:";
const PLAYER_STORAGE_PREFIX = "tictactoe:players:";
const ROUND_STORAGE_PREFIX = "tictactoe:round:";
const SHARED_KEY_STORAGE = "tictactoe:shared-room-key";

const cheerStorageKey = (roomKey) => `${CHEER_STORAGE_PREFIX}${roomKey}`;
const scoreStorageKey = (roomKey) => `${SCORE_STORAGE_PREFIX}${roomKey}`;
const playerStorageKey = (roomKey) => `${PLAYER_STORAGE_PREFIX}${roomKey}`;
const roundStorageKey = (roomKey) => `${ROUND_STORAGE_PREFIX}${roomKey}`;

export function publishCheer(roomKey, entry) {
    localStorage.setItem(cheerStorageKey(roomKey), JSON.stringify(entry));
}

export function cheerFromStorageEvent(event, roomKey) {
    if (!roomKey || !event || event.key !== cheerStorageKey(roomKey)) return null;
    try {
        const entry = JSON.parse(event.newValue);
        if (typeof entry?.source !== "string" || typeof entry?.text !== "string") return null;
        return entry;
    } catch {
        return null;
    }
}

export function publishSharedKey(key) {
    localStorage.setItem(SHARED_KEY_STORAGE, key);
}

export function sharedKeyFromStorageEvent(event) {
    const key = event?.newValue || "";
    return event?.key === SHARED_KEY_STORAGE && KEY_PATTERN.test(key) ? key : "";
}

export function readPlayerProfiles(roomKey) {
    try {
        const players = JSON.parse(localStorage.getItem(playerStorageKey(roomKey))) || {};
        return Object.fromEntries(["X", "O"].flatMap((tile) => {
            const player = players[tile];
            if (typeof player?.name !== "string" || !PLAYER_AVATARS.includes(player.avatar)) return [];
            return [[tile, {
                name: player.name.slice(0, 10),
                avatar: player.avatar,
                id: KEY_PATTERN.test(player.id) ? player.id : crypto.randomUUID()
            }]];
        }));
    } catch {
        return {};
    }
}

export function savePlayerProfiles(roomKey, players) {
    try {
        localStorage.setItem(playerStorageKey(roomKey), JSON.stringify(players));
    } catch {}
}

export function savePlayerProfile(roomKey, tile, profile) {
    if (!roomKey || !tile || !profile) return;
    const existing = readPlayerProfiles(roomKey)[tile];
    savePlayerProfiles(roomKey, {
        ...readPlayerProfiles(roomKey),
        [tile]: { ...profile, id: profile.id || existing?.id || crypto.randomUUID() }
    });
}

export function isPlayerProfilesEvent(event, roomKey) {
    return Boolean(roomKey) && event?.key === playerStorageKey(roomKey);
}

export function readStoredScores(roomKey) {
    try {
        const scores = JSON.parse(localStorage.getItem(scoreStorageKey(roomKey)));
        if (Number.isInteger(scores?.X) && Number.isInteger(scores?.O)) return scores;
    } catch {}
    return { X: 0, O: 0 };
}

export function saveStoredScores(roomKey, scores) {
    try {
        localStorage.setItem(scoreStorageKey(roomKey), JSON.stringify(scores));
    } catch {}
}

export function isScoresEvent(event, roomKey) {
    return Boolean(roomKey) && event?.key === scoreStorageKey(roomKey);
}

export function readRoundGameId(roomKey) {
    try {
        const gameId = localStorage.getItem(roundStorageKey(roomKey));
        return KEY_PATTERN.test(gameId) ? gameId : "";
    } catch {
        return "";
    }
}

export function saveRoundGameId(roomKey, gameId) {
    if (!roomKey || !KEY_PATTERN.test(gameId)) return;
    try {
        localStorage.setItem(roundStorageKey(roomKey), gameId);
    } catch {}
}

export function createRoundGameId(roomKey) {
    const gameId = crypto.randomUUID();
    saveRoundGameId(roomKey, gameId);
    return gameId;
}

