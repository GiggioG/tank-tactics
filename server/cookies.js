import { clearExpiredSessions } from "./db.js";

export function getSessionUser(cookies) {
    clearExpiredSessions();
    if (!cookies["session"]) {
        return null;
    }
    let sess = cookies["session"];
    if (!db.sessions[sess]) {
        return null;
    }
    return db.sessions[sess].uname;
}
export function parseCookies(cookies) {
    if (!cookies) { return {}; }
    return cookies
        .split(';')
        .map(e => e.trim())
        .map(e => {
            let a = e.split('=');
            if (a.length == 1) { a.push(true); }
            let o = {};
            o[a[0]] = a[1];
            return o;
        })
        .reduce((acc, el) => ({ ...acc, ...el }), {});
}