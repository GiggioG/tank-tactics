async function _login() {
    let uname = document.querySelector("div.modalBkg.active input.uname").value;
    let passwd = document.querySelector("div.modalBkg.active input.passwd").value;

    if (!uname || !passwd) {
        document.querySelector("div.modalBkg.active p.modalError").innerText = "You must include both username and password.";
        return;
    }

    let resp = await fetch(`${location.origin}/api/login?uname=${uname}&passwd=${passwd}`, { method: "POST" });
    if (resp.ok) { location.reload(); }
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
    let confirmUnregister = await new Promise((resolve, reject) => {
        const modalBkg = document.querySelector("div#confirmUnregisterModalBkg");
        modalBkg.querySelector("button#confirmUnregisterModalOKButton").addEventListener("click", () => { closeModal(); resolve(true); }, { once: true });
        modalBkg.querySelector("button#confirmUnregisterModalCancelButton").addEventListener("click", () => { closeModal(); resolve(false); }, { once: true });
        openModal(modalBkg);
    });
    if (!confirmUnregister) { return; }
    await fetch(`${location.origin}/api/unregister`, { method: "DELETE" });
    location.reload();
}

async function _logout() {
    await fetch(`${location.origin}/api/logout`, { method: "DELETE" });
    location.reload();
}

function setupListeners() {
    document.querySelector("button#modalLogInButton")?.addEventListener("click", _login);
    document.querySelector("button#logOutButton")?.addEventListener("click", _logout);

    document.querySelector("button#modalRegisterButton")?.addEventListener("click", _register);
    document.querySelector("button#unregisterButton")?.addEventListener("click", _unregister);
}