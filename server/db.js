import * as fs from "fs";
export function initDB() {
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            status: "registration", // "registration", "in-game", "post-game"
            accounts: {},
            gameState: null
        }));
    }
    global.db = JSON.parse(fs.readFileSync("./db.json"));
}
export function saveDB() {
    fs.writeFileSync("./db.json", JSON.stringify(db));
}