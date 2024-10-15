import * as fs from "fs";
export function initDB() {
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            status: "registration", // "registration", "in-game", "post-game"
            accounts: {},
            sessions: {}, /// stored in cookies
            gameState: null
        }));
    }
    global.db = JSON.parse(fs.readFileSync("./db.json"));
}
export function saveDB() {
    fs.writeFileSync("./db.json", JSON.stringify(db));
}
export function clearExpiredSessions(){
    let now = Number(new Date());
    let deletedSession = false;
    for(let sessId in db.sessions){
        if(db.sessions[sessId].expires <= now || (!db.accounts[db.sessions[sessId].uname])){
            delete db.sessions[sessId];
            deletedSession = true;
        }
    }
    if(deletedSession){
        saveDB();
    }
}