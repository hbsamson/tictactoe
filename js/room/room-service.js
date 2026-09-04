import { gameApi, gameRecordApi } from "../api.js";
import {
    createRoundGameId, cheerFromStorageEvent, isPlayerProfilesEvent, isScoresEvent,
    publishCheer, publishSharedKey, readPlayerProfiles, readRoundGameId,
    readStoredCurrentPlayer, readStoredScores, savePlayerProfile, savePlayerProfiles,
    saveStoredScores, sharedKeyFromStorageEvent, storeCurrentPlayer
} from "./room-storage.js";

export class RoomService {
    check(key) { return gameApi.check(key); }
    create(key) { return gameApi.create(key); }
    board(key) { return gameApi.board(key); }
    move(key, tile, x, y) { return gameApi.move(key, tile, x, y); }
    reset(key) { return gameApi.reset(key); }
    resetUrl(key) { return gameApi.resetUrl(key); }
    saveMove(record) { return gameRecordApi.save(record); }
    createRoundId(key) { return createRoundGameId(key); }
    readRoundId(key) { return readRoundGameId(key); }
    readProfiles(key) { return readPlayerProfiles(key); }
    saveProfile(key, tile, profile) { savePlayerProfile(key, tile, profile); }
    saveProfiles(key, profiles) { savePlayerProfiles(key, profiles); }
    readScores(key) { return readStoredScores(key); }
    saveScores(key, scores) { saveStoredScores(key, scores); }
    saveCurrentPlayer(profile) { storeCurrentPlayer(profile); }
    readCurrentPlayer() { return readStoredCurrentPlayer(); }
    publishCheer(key, entry) { publishCheer(key, entry); }
    cheerFromStorageEvent(event, key) { return cheerFromStorageEvent(event, key); }
    publishSharedKey(key) { publishSharedKey(key); }
    sharedKeyFromStorageEvent(event) { return sharedKeyFromStorageEvent(event); }
    isProfilesEvent(event, key) { return isPlayerProfilesEvent(event, key); }
    isScoresEvent(event, key) { return isScoresEvent(event, key); }
}
