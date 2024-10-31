import * as https from "http"; // TODO
import * as fs from "fs";
import * as url from "url";
import * as path from "path";
import * as ws from "ws";
import { initDB, saveDB, clearExpiredSessions } from "./db.js";
import Game from "./game.js";
import { Coord } from "../lib/coord.js"
import Grid from "../lib/grid.js"
import public_endpoint from "./public_endpoint.js";
import api_endpoint from "./api.js";
import { ws_handler, giveOutApAndBroadcastResults } from "./ws.js"

initDB();

let webServer = https.createServer({
    key: fs.readFileSync("./certs/devtest.key"),
    cert: fs.readFileSync("./certs/devtest.crt"),
}, (req, res) => {
    let parsed = url.parse(req.url);
    let pathname = parsed.pathname;
    if (pathname == "/") {
        pathname = "/index.html";
    }
    if (pathname.startsWith("/api")) {
        return api_endpoint(parsed, req, res);
    }
    return public_endpoint(parsed, req, res);
}).listen(8080);


let webSocketServer = new ws.WebSocketServer({
    server: webServer,
    path: "/api/ws"
});
webSocketServer.on("connection", ws_handler);
webSocketServer.shouldHandle = function (req) {
    if (db.status == "registration") { return false; }

    /// from default shouldHandle function
    if (this.options.path) {
        const index = req.url.indexOf('?');
        const pathname = index !== -1 ? req.url.slice(0, index) : req.url;

        if (pathname !== this.options.path) return false;
    }

    return true;
}

// main
if (db.status != "registration") {
    if (db.gameState == null) {
        Game.instance = new Game(Object.keys(db.accounts));
        db.gameState = Game.instance.serialise();
        saveDB();
    } else {
        Game.instance = Game.deserialise(db.gameState);
    }
}

setInterval(giveOutApAndBroadcastResults, 1000 * 60 * 5); giveOutApAndBroadcastResults(); /// TODO: temporary

// TODO
// setInterval(Game.instance.giveOutAP, 24*60*60*1000);
// setInterval(saveDB, 2 * 60 * 1000);
// setInterval(clearInvalidSessions, 2*60*1000); (invalid: expired or deleted user)

// TODO
// result for giving out ap should be broadcast

/// TODO
/// remember when ap was last given out in order to give out appropriately for missed givings