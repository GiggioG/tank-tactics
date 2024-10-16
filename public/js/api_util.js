async function getLoggedInUser(){
    if(window.loggedInUname){ return window.loggedInUname; }
    let resp = await fetch(`${location.origin}/api/whoami`);
    const res = await resp.json();
    window.loggedInUname = res;
    return res;
}

async function getGameState(){
    if(window.gameState){ return window.gameState; }
    let resp = await fetch(`${location.origin}/api/getGameState`);
    const res = await resp.text();
    window.gameState = res;
    return res;
}

