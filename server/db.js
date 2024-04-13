import * as fs from "fs";
export function initDB() {
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            status: "registration", // "registration", "in-game", "post-game"
            accounts: {
                "test": {
                    uname: "test",
                    salt: "soleno",
                    passwd: "IVlCS9F0W383THDrVrh+ec2y3KRthDdTDbd+uPy1Ta8=", /// password: pishka
                }
            },
            sessions: {
                "34c290d3-419f-4b38-a98c-3aa768bb08fb": {
                    uname: "test",
                    expires: 91318612132189
                }
            },
            gameState: null
        }));
    }
    global.db = JSON.parse(fs.readFileSync("./db.json"));
}
export function saveDB() {
    fs.writeFileSync("./db.json", JSON.stringify(db));
}
export function clearExpiredSessions(){
    throw new Error("TODO");
}