import * as ws from "ws";
import * as https from "http"; //TODO
import * as crypto from "crypto";
import Game from "./game.js";
import { Coord } from "../lib/coord.js";
import { saveDB } from "./db.js";
import { getSessionUser, parseCookies } from "./cookies.js";

const genUuid = () => crypto.randomUUID();

let socks = {};
let userSocks = {};

/**
 * @param {ws.WebSocket} sock
 * @param {string} err 
 */
function writeError(sock, err) {
    sock.send(JSON.stringify({
        type: "error",
        msg: err.toString()
    }));
}

function broadcast(msg) {
    const stringified = JSON.stringify(msg);
    for (const id in socks) {
        socks[id].send(stringified);
    }
}

function sendToPlayer(msg, usr) {
    const stringified = JSON.stringify(msg);
    if (!userSocks[usr]) { return; }
    for (const id of userSocks[usr]) {
        socks[id].send(stringified);
    }
}

export function giveOutApAndBroadcastResults() {
    if (db.status != "in-game") { return true; }
    let { vote: voteAttempt, ap: apAttempt } = Game.instance.giveOutAP();
    db.lastGaveOutAP = Number(new Date());
    if(db.firstGaveOutAP == null){ db.firstGaveOutAP = db.lastGaveOutAP; }
    saveDB();
    /// ap updates - for everyone
    {
        const sendObj = {
            type: "updates",
            updates: apAttempt.result
        };
        broadcast(sendObj);
    }
    /// vote updates - only for the voters
    for(const ch of voteAttempt.result) {
        const sendObj = {
            type: "updates",
            updates: [ch]
        };
        sendToPlayer(sendObj, ch.player);
    }
}

/**
 * @param {ws.WebSocket} sock
 * @param {https.IncomingMessage} req
 * @returns {void}
 */
export function ws_handler(sock, req) {
    sock.uuid = genUuid();
    socks[sock.uuid] = sock;
    let cookies = parseCookies(req.headers.cookie);
    sock.user = getSessionUser(cookies);
    if (sock.user) {
        if (!userSocks[sock.user]) { userSocks[sock.user] = new Set(); }
        userSocks[sock.user].add(sock.uuid);
    }

    sock.send(JSON.stringify({
        type: "gameState",
        state: Game.instance.serialiseForClient(sock.user)
    }));
    sock.on("message", rawMsg => {
        if (!sock.user) { return writeError(sock, "spectators (not logged in users) can't do things."); }

        if (db.status == "post-game") { return writeError(sock, "The game has already ended."); }
        const msg = JSON.parse(rawMsg);
        let attempt = null;
        if (msg.type == "move") {
            if (!msg.coord || typeof msg.coord != "string" || !Coord.isCoord(msg.coord)) {
                return writeError(sock, "ws message must include coord (.toString)");
            }
            attempt = Game.instance.tryMove(sock.user, Coord.getCoord(msg.coord));
        } else if (msg.type == "attack") {
            if (!msg.patient || typeof msg.patient != "string") {
                return writeError(sock, "ws message must include patient - username");
            }
            if (!msg.amount || typeof msg.amount != "number" || Math.floor(msg.amount) != msg.amount) {
                return writeError(sock, "ws message must include amount - whole number");
            }
            attempt = Game.instance.tryAttack(sock.user, msg.patient, msg.amount);
        } else if (msg.type == "give") {
            if (!msg.patient || typeof msg.patient != "string") {
                return writeError(sock, "ws message must include patient - username");
            }
            if (!msg.amount || typeof msg.amount != "number" || Math.floor(msg.amount) != msg.amount) {
                return writeError(sock, "ws message must include amount - whole number");
            }
            attempt = Game.instance.tryGive(sock.user, msg.patient, msg.amount);
        } else if (msg.type == "upgrade") {
            if (!msg.amount || typeof msg.amount != "number" || Math.floor(msg.amount) != msg.amount) {
                return writeError(sock, "ws message must include amount - whole number");
            }
            attempt = Game.instance.tryUpgrade(sock.user, msg.amount);
        } else if (msg.type == "vote") {
            if (!msg.hasOwnProperty("patient") || (typeof msg.patient != "string" && msg.patient !== null)) {
                return writeError(sock, "ws message must include patient - username or null");
            }
            attempt = Game.instance.tryVote(sock.user, msg.patient);
        } else {
            return writeError(sock, `no such action: ${msg.type}`);
        }

        if (attempt) {
            if (attempt.success) {
                saveDB();
                const sendObj = {
                    type: "updates",
                    updates: attempt.result
                };
                if (msg.type == "vote") {
                    return sock.send(JSON.stringify(sendObj))
                }
                broadcast(sendObj);
                if (Game.instance.gameOver) {
                    db.status = "post-game";
                    saveDB();
                    broadcast({ type: "winner" });
                }
                return;
            } else {
                return writeError(sock, attempt.result);
            }
        }
    });
    sock.on("close", () => {
        if (sock.user) {
            userSocks[sock.user].delete(sock.uuid);
        }
        delete socks[sock.uuid];
    });
}