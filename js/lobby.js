import { KEY_PATTERN, PLAYER_AVATARS } from "./config.js";

export function generateKey() {
    return crypto.randomUUID().slice(0, 6).toUpperCase();
}

export function isValidKey(key) {
    return KEY_PATTERN.test(key);
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
