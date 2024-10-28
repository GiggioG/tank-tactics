import * as querystring from "querystring";
import * as ws from "ws";
import * as url from "url";
import * as https from "http"; // TODO
import * as crypto from "crypto";
import { saveDB } from "./db.js";
import { getSessionUser, parseCookies } from "./cookies.js";
import Game from "./game.js";

const COOKIE_EXPIRY = 500 * 60 * 1000;/// millis // TODO

const getHash = e => crypto.createHash("sha256").update(e).digest("base64");
const genUuid = () => crypto.randomUUID();
const genSalt = () => crypto.randomBytes(4).toString("base64");
const getUTCDateAfterMilis = milis => new Date(Number(new Date()) + milis);
const getYesterday = () => new Date(Number(new Date) - 24 * 60 * 60 * 1000);

function list_users() {
    let list = Object.keys(db.accounts).map(e => ({
        name: e,
        hp: (db.status != "registration" ? Game.instance.players[e].hp : 1)
    }));
    return { status: 200, data: JSON.stringify(list) };
}

function _createSession(uname) {
    let session = genUuid();
    let expires = getUTCDateAfterMilis(COOKIE_EXPIRY);
    db.sessions[session] = { uname, expires: Number(expires) };
    saveDB();
    return { status: 204, setCookies: [`session=${session}; expires=${expires.toUTCString()}; path=/`] };
}

function register(query, cookies) {
    if (getSessionUser(cookies)) {
        return { status: 400, data: "You can't register when you're logged in." };
    }

    if (!query["uname"] || !query["passwd"]) {
        return { status: 400, data: "Must include `uname` and `passwd` query params." };
    }
    let { uname, passwd } = query;
    /// validate uname
    let unameRegex = /^[\w-_]{4,20}$/;
    if (!unameRegex.test(uname)) {
        return { status: 400, data: "Username doesn't match requirements." };
    }
    /// check availability
    if (db.accounts[uname]) {
        return { status: 400, data: "Username is taken." }
    }
    /// validate passwd
    if (passwd.length < 8) {
        return { status: 400, data: "Password should be minimum 8 characters long." };
    }
    /// valid: register
    let salt = genSalt();
    db.accounts[uname] = {
        uname,
        salt,
        passwd: getHash(passwd + salt),
    }
    saveDB();
    return _createSession(uname);
}

function login(query, cookies) {
    if (getSessionUser(cookies)) {
        return { status: 400, data: "You have already logged in." };
    }

    if (!query["uname"] || !query["passwd"]) {
        return { status: 400, data: "Must include `uname` and `passwd` query params." };
    }
    let { uname, passwd } = query;
    if (!db.accounts[uname]) {
        return { status: 401, data: "This user does not exist." };
    }
    let account = db.accounts[uname];
    let pwdHash = getHash(passwd + account.salt);
    if (account.passwd != pwdHash) {
        return { status: 401, data: "Wrong password." };
    }
    /// valid: login
    return _createSession(uname);
}


function logout(query, cookies) {
    if (!cookies["session"]) {
        return { status: 401, data: "Not logged in." };
    }
    let sess = cookies["session"];
    if (!db.sessions[sess]) {
        return { status: 401, data: "Invalid session.", setCookies: [`session=null; expires=${getYesterday().toUTCString()}; path=/`] };
    }
    delete db.sessions[sess];
    saveDB();
    return { status: 200, data: "Removed session.", setCookies: [`session=null; expires=${getYesterday().toUTCString()}; path=/`] }
}

function whoami(query, cookies) {
    let user = getSessionUser(cookies);
    return { status: 200, data: JSON.stringify(user) };
}

function unregister(query, cookies) {
    let user = getSessionUser(cookies);
    if (!user) {
        return { status: 401, data: "Not logged in" };
    }
    delete db.accounts[user];
    saveDB();
    return { status: 200, data: "Unregistered.", setCookies: [`session=null; expires=${getYesterday().toUTCString()}; path=/`] }
}

function getGameStatus(query, cookies) {
    return { status: 200, data: db.status };
}

/**
 * 
 * @param {url.URL} parsed
 * @param {https.IncomingMessage} req
 * @param {https.ServerResponse<https.IncomingMessage>} res
 * @returns {void}
 */
export default function api_endpoint(parsed, req, res) {
    let pathname = parsed.pathname;
    let query = querystring.parse(parsed.query);
    const endpoint = pathname.slice(5);
    const cookies = parseCookies(req.headers.cookie);
    let status = 500, data = null, setCookies = null;
    if (endpoint == "list_users" && req.method == "GET") {
        ({ status, data, setCookies } = list_users(query, cookies));
    } else if (endpoint == "register" && req.method == "POST" && db.status == "registration") {
        ({ status, data, setCookies } = register(query, cookies));
    } else if (endpoint == "login" && req.method == "POST") {
        ({ status, data, setCookies } = login(query, cookies));
    } else if (endpoint == "logout" && req.method == "DELETE") {
        ({ status, data, setCookies } = logout(query, cookies));
    } else if (endpoint == "whoami" && req.method == "GET") {
        ({ status, data, setCookies } = whoami(query, cookies));
    } else if (endpoint == "unregister" && req.method == "DELETE" && db.status == "registration") {
        ({ status, data, setCookies } = unregister(query, cookies));
    } else if (endpoint == "getGameState" && req.method == "GET") {
        ({ status, data, setCookies } = getGameStatus(query, cookies));
    } else {
        status = 404;
        data = "Error 404: Not found.";
    }

    if (setCookies) {
        res.setHeader("Set-Cookie", setCookies);
    }
    res.writeHead(status);
    res.end(data);
}