import * as fs from "fs";
import * as https from "https";
import * as url from "url";
import * as path from "path";
import * as ws from "ws";
import { initDB, saveDB, clearInvalidSessions } from "./db.js";
import Game from "./game.js";
import { Coord } from "../lib/coord.js"
import Grid from "../lib/grid.js"
import public_endpoint from "./public_endpoint.js";
import api_endpoint from "./api.js";
import { ws_handler, giveOutApAndBroadcastResults } from "./ws.js"
global.CONFIG = JSON.parse(fs.readFileSync("./config.json"));

initDB();

let webServer = https.createServer({
    key: fs.readFileSync(CONFIG.tls.keyFile),
    cert: fs.readFileSync(CONFIG.tls.crtFile),
}, async (req, res) => {
    req.body = await new Promise((resolve, reject) => {
        let requestBody = [];
        req.on("data", chunk => requestBody.push(chunk) );
        req.on("end", ()=>{
            resolve(Buffer.concat(requestBody).toString());
        });
    });
    let parsed = url.parse(req.url);
    let pathname = parsed.pathname;
    if (pathname == "/") {
        pathname = "/index.html";
    }
    if (pathname.startsWith("/api")) {
        return api_endpoint(parsed, req, res);
    }
    return public_endpoint(parsed, req, res);
}).listen(process.env.PORT || CONFIG.customPort);


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
        saveDB();
    } else {
        Game.instance = Game.deserialise(db.gameState);
    }
}

setInterval(saveDB, 2 * 60 * 1000);
setInterval(clearInvalidSessions, 2 * 60 * 1000);

export function beginApGivingInterval() {
    function floatMod(x, m) {
        const d = x / m;
        return (d - Math.floor(d)) * m;
    }
    const now = Number(new Date());
    const AP_PERIOD = 1000 * 60 * 0.5;
    if (db.lastGaveOutAP + AP_PERIOD < now) {
        /*
        in case the game was down when AP has to be given out
        deliberately don't give out for all the missed times (if multiple),
        because that would cause chaos.
        */
        giveOutApAndBroadcastResults();
    }


    const timeUntilMultipleOfPeriod = AP_PERIOD - floatMod(now - db.firstGaveOutAP, AP_PERIOD);
    setTimeout(() => {
        giveOutApAndBroadcastResults();
        setInterval(giveOutApAndBroadcastResults, AP_PERIOD);
    }, timeUntilMultipleOfPeriod);
}

if (db.status == "in-game") {
    beginApGivingInterval();
}