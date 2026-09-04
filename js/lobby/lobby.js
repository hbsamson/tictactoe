import { KEY_PATTERN, PLAYER_AVATARS } from "../config.js";

const TAB_PLAYER_ID_KEY = "tictactoe:tab-player-id";

export function generateKey() {
    return crypto.randomUUID();
}

export function isValidKey(key) {
    return KEY_PATTERN.test(key);
}

/**
 * Returns the stable player ID for THIS browser window/tab.
 * Kept in sessionStorage so it is never shared between windows or browsers,
 * and is never derived from the player name/avatar — so two different players
 * with the same name never collide, and each window keeps its own history.
 */
export function getTabPlayerId() {
    try {
        const stored = sessionStorage.getItem(TAB_PLAYER_ID_KEY);
        if (KEY_PATTERN.test(stored)) return stored;
    } catch {}
    const id = crypto.randomUUID();
    try {
        sessionStorage.setItem(TAB_PLAYER_ID_KEY, id);
    } catch {}
    return id;
}

export function getLobbyProfile(elements) {
    const avatar = elements.playerAvatar.value || "ren";
    const defaultName = avatar.charAt(0).toUpperCase() + avatar.slice(1);
    return { name: elements.playerName.value.trim().slice(0, 10) || defaultName, avatar };
}

export function changeAvatar(elements, direction) {
    const previousAvatar = elements.playerAvatar.value;
    const previousName = previousAvatar.charAt(0).toUpperCase() + previousAvatar.slice(1);
    const currentIndex = PLAYER_AVATARS.indexOf(previousAvatar);
    const avatar = PLAYER_AVATARS[(currentIndex + direction + PLAYER_AVATARS.length) % PLAYER_AVATARS.length];
    const name = avatar.charAt(0).toUpperCase() + avatar.slice(1);
    const enteredName = elements.playerName.value.trim();

    elements.playerAvatar.value = avatar;
    elements.avatarPreview.src = `assets/icons/${avatar}.png`;
    elements.avatarPreview.alt = name;
    if (!enteredName || enteredName === previousName) elements.playerName.value = name;
}

