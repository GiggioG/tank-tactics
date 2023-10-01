export function initDB() {
    const fs = require("fs");
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            status: "registration", // "registration", "in-game", "post-game"
            players: {}
        }));
    }
    global.db = JSON.parse(fs.readFileSync("./db.json"));
}
export function saveDB() {
    const fs = require("fs");
    fs.writeFileSync("./db.json", JSON.stringify(db));
}