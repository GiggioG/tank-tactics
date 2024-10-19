import * as ws from "ws";
import * as https from "http"; //TODO
import * as crypto from "crypto";
import Game from "./game.js";
import Coord from "../lib/coord.js";
import { saveDB } from "./db.js";
import { getSessionUser, parseCookies } from "./cookies.js";

const genUuid = () => crypto.randomUUID();

let socks = {};

/**
 * @param {ws.WebSocket} sock
 * @param {string} err 
 */
function writeError(sock, err){
    sock.send(JSON.stringify({
        type: "error",
        msg: err.toString()
    }));
}

function broadcast(msg){
    let stringified = JSON.stringify(msg);
    for(const id in socks){
        socks[id].send(stringified);
    }
}

/**
 * @param {ws.WebSocket} sock
 * @param {https.IncomingMessage} req
 * @returns {void}
 */
export default function ws_handler(sock, req) {
    sock.uuid = genUuid();
    socks[sock.uuid] = sock;
    let cookies = parseCookies(req.headers.cookie);
    sock.user = getSessionUser(cookies);

    sock.send(JSON.stringify({
        type: "gameState",
        state: Game.instance.serialiseForClient()
    }));
    sock.on("message", rawMsg => {
        if(!sock.user){ return writeError(sock, "spectators (not logged in users) can't do things."); }

        const msg = JSON.parse(rawMsg);
        let attempt = null;
        if(msg.type == "move"){
            if(!msg.coord || typeof msg.coord != "string" || Coord.isCoord(msg.coord)){
                return writeError(sock, "ws message must include coord (.toString)");
            }
            attempt = Game.instance.tryMove(sock.user, Coord.getCoord(msg.coord));
        }else if(msg.type == "attack"){
            if(!msg.patient || typeof msg.patient != "string"){
                return writeError(sock, "ws message must include patient - username");
            }
            if(!msg.amount || typeof msg.amount != "number" || Math.floor(msg.amount) != msg.amount){
                return writeError(sock, "ws message must include amount - whole number");
            }
            attempt = Game.instance.tryAttack(sock.user, msg.patient, msg.amount);
        }else if(msg.type == "give"){
            if(!msg.patient || typeof msg.patient != "string"){
                return writeError(sock, "ws message must include patient - username");
            }
            if(!msg.amount || typeof msg.amount != "number" || Math.floor(msg.amount) != msg.amount){
                return writeError(sock, "ws message must include amount - whole number");
            }
            attempt = Game.instance.tryGive(sock.user, msg.patient, msg.amount);
        }else if(msg.type == "upgrade"){
            if(!msg.amount || typeof msg.amount != "number" || Math.floor(msg.amount) != msg.amount){
                return writeError(sock, "ws message must include amount - whole number");
            }
            attempt = Game.instance.tryUpgrade(sock.user, msg.amount);
        }else if(msg.type == "vote"){
            if(!msg.patient || typeof msg.patient != "string"){
                return writeError(sock, "ws message must include patient - username");
            }
            attempt = Game.instance.tryVote(sock.user, msg.patient);
        }else{
            return writeError(sock, `no such action: ${msg.type}`);
        }

        if(attempt){
            if(attempt.success){
                db.gameState = Game.instance.serialiseForClient();
                saveDB();
                return broadcast(attempt.result);
            }
            else {
                return writeError(sock, attempt.result);
            }
        }
    });
    sock.on("close", () => {
        delete socks[sock.uuid];
    });
}