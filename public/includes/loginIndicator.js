async function getLoggedInUser(){
    let resp = await fetch(`${location.origin}/api/whoami`);
    return await resp.json();
}

async function getGameState(){
    let resp = await fetch(`${location.origin}/api/getGameState`);
    return await resp.text();
}

async function _login(){
    let uname = document.querySelector("div.modalBkg.active input.uname").value;
    let passwd = document.querySelector("div.modalBkg.active input.passwd").value;

    if(!uname || !passwd){
        document.querySelector("div.modalBkg.active p.modalError").innerText = "You must include both username and password.";
        return;
    }
    
    let resp = await fetch(`${location.origin}/api/login?uname=${uname}&passwd=${passwd}`, { method: "POST" });
    if(resp.ok){ location.reload(); }
    let text = await resp.text();
    document.querySelector("div.modalBkg.active p.modalError").innerText = text;
}

async function _register() {
    let modalError = getActiveModalBkg().querySelector("p.modalError");

    let uname = document.querySelector("div.modalBkg.active input.uname").value;
    let passwd = document.querySelector("div.modalBkg.active input.passwd").value;

    if (!uname || !passwd) {
        modalError.innerText = "You must include both username and password.";
        return;
    }

    let unameRegex = /^[\w-_]{4,20}$/;
    if (!unameRegex.test(uname)) {
        let errorMsg = "Username must be between 4 and 20 characters must consist of english letters, numbers, \'-\' or \'_\'.";
        return modalError.innerText = errorMsg;
    }

    if (passwd.length < 8) {
        return modalError.innerText = "Password should be minimum 8 characters long.";
    }

    let resp = await fetch(`${location.origin}/api/register?uname=${uname}&passwd=${passwd}`, { method: "POST" });
    if (resp.ok) { location.reload(); }
    let text = await resp.text();
    modalError.innerText = text;
}

async function _unregister() {
    if (!confirm("Confirm deletion of your account? You can register again before the registering period ends.")) { return; }
    await fetch(`${location.origin}/api/unregister`, { method: "DELETE" });
    location.reload();
}

async function _logout(){
    if(!confirm("Confirm log out?")){ return; }
    await fetch(`${location.origin}/api/logout`, { method: "DELETE" });
    location.reload();
}

function setupListeners(){
    document.querySelector("button#modalLogInButton")?.addEventListener("click", _login);
    document.querySelector("button#logOutButton")?.addEventListener("click", _logout);

    document.querySelector("button#modalRegisterButton")?.addEventListener("click", _register);
    document.querySelector("button#unregisterButton")?.addEventListener("click", _unregister);
}

export default async function main(){
    let div = document.querySelector("div#loginIndicator");
    let notLoggedIn = div.querySelectorAll("template")[0];
    let loggedIn = div.querySelectorAll("template")[1];
    
    let uname = await getLoggedInUser();
    let gameState = await getGameState();
    window.sessionUname = uname;
    if(!uname){
        div.replaceChildren(notLoggedIn.content);
        div.classList.add("notLogggedIn");
    }else{
        div.classList.add("loggedIn");
        div.replaceChildren(loggedIn.content);
        div.querySelector("span.username").innerText = uname;
    }
    if(gameState != "registration"){
        Array.from(div.querySelectorAll(".onlyRegistration")).forEach(e=>e.remove());
    }
    setupListeners();
};