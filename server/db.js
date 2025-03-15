import * as fs from "fs";
import Game from "./game.js";
export function initDB() {
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            status: "registration", // "registration", "in-game", "post-game"
            accounts: {},
            sessions: {}, /// stored in cookies
            gameState: null,
            lastGaveOutAP: null,
            firstGaveOutAP: null
        }));
    }
    global.db = JSON.parse(fs.readFileSync("./db.json"));
}
export function saveDB() {
    if(Game.instance != null){
        db.gameState = Game.instance.serialise();
    }
    fs.writeFileSync("./db.json", JSON.stringify(db));
}
export function clearInvalidSessions() {
    let now = Number(new Date());
    let deletedSession = false;
    for (let sessId in db.sessions) {
        if (db.sessions[sessId].expires <= now || (!db.accounts[db.sessions[sessId].uname])) {
            delete db.sessions[sessId];
            deletedSession = true;
        }
    }
    if (deletedSession) {
        saveDB();
    }
}