import { Coord, crd } from "../../lib/coord.js";
import Grid from "../../lib/grid.js";

const COLOURS = {
    gridLines: "darkgrey",
    gridBackground: "black",

    normalPlayerBorder: "darkgreen",
    loggedInPlayerBorder: "lime",
    winnerBorder: "magenta",
    normalPlayerBackground: "black",
    loggedInPlayerBackground: "black",
    winnerBackground: "rgb(50, 0, 50)",

    normalName: "white",
    winnerName: "yellow",

    hpStat: "red",
    apStat: "lime",
    rangeStat: "orange",

    thisPlayerRangeBorder: "orange",
    thisPlayerRangeFill: "rgb(255, 165, 0, 0.2)", /// "orange" with opacity
    selPlayerRangeBorder: "maroon",
    selPlayerRangeFill: "rgb(128, 0, 0, 0.2)", /// "maroon" with opacity

    reachableSquareFill: "rgb(0, 0, 255, 0.3)",
    selctedSquareBorder: "yellow",

    currentVote: "rgb(100, 100, 255, 0.7)",
    hasntVoted: "rgb(255, 0, 0, 0.7)"
}

let ws = null;
/**
 * @type {CanvasRenderingContext2D}
*/
let ctx = null;
let width = null, height = null;
let canvasX = null, canvasY = null;

let currState = null;

let originX = null, originY = null;
let squareSide = null, gridSide = null;
let dim = null;

let selectedSquare = null;
let distsFromPlayer = null;

let errorModalOKFunction = null;

function boundOrigin() {
    if (gridSide > width) {
        if (originX > 0) { originX = 0; }
        if (originX + gridSide < width) { originX = width - gridSide; }
    } else {
        originX = width / 2 - gridSide / 2;
    }
    if (gridSide > height) {
        if (originY > 0) { originY = 0; }
        if (originY + gridSide < height) { originY = height - gridSide; }
    } else {
        originY = height / 2 - gridSide / 2;
    }
}

function centerCoordinates(pos) {
    originX = width / 2 - (pos.c * squareSide) - squareSide / 2;
    originY = height / 2 - (pos.r * squareSide) - squareSide / 2;

    boundOrigin();
}

function setup() { /// drawing setup, name borrowed from p5.js
    let { x: cx, y: cy } = ctx.canvas.getBoundingClientRect();
    canvasX = cx;
    canvasY = cy;

    squareSide = Math.max(Math.min(width / dim, height / dim), 45);
    gridSide = squareSide * dim;

    if (loggedInUname && currState.players[loggedInUname].hp > 0) {
        let playerPos = currState.players[loggedInUname].pos;
        centerCoordinates(playerPos);

        distsFromPlayer = currState.grid.getDistsFromPos(playerPos);
    } else {
        let avgR = 0, avgC = 0, aliveCount = 0;
        for (const p in currState.players) {
            if (currState.players[p].pos != null) {
                avgR += currState.players[p].pos.r;
                avgC += currState.players[p].pos.c;
                aliveCount++;
            }
        }
        avgR /= aliveCount;
        avgC /= aliveCount
        centerCoordinates(new Coord(Math.round(avgR), Math.round(avgC)));
    }

    document.querySelector("button#modalAttackButton").addEventListener("click", attackModalSubmitted);
    document.querySelector("button#modalGiveButton").addEventListener("click", giveModalSubmitted);
    document.querySelector("button#modalUpgradeButton").addEventListener("click", upgradeModalSubmitted);
}

function drawPlayer(p) {
    let x = originX + p.pos.c * squareSide, y = originY + p.pos.r * squareSide;

    ctx.fillStyle = (p.name == loggedInUname ? COLOURS.loggedInPlayerBorder : COLOURS.normalPlayerBorder);
    if (gameState == "post-game" && currState.winner == p.name) {
        ctx.fillStyle = COLOURS.winnerBorder;
    }
    ctx.fillRect(x, y, squareSide, squareSide);

    const BORDER_WIDTH = 3, MARGIN = 5;

    const left = x + BORDER_WIDTH;
    const top = y + BORDER_WIDTH;
    const right = x + squareSide - BORDER_WIDTH;
    const bottom = y + squareSide - BORDER_WIDTH;
    const middle = x + squareSide / 2;
    const innerWidth = squareSide - 2 * BORDER_WIDTH;

    ctx.fillStyle = (p.name == loggedInUname ? COLOURS.loggedInPlayerBackground : COLOURS.normalPlayerBackground);
    if (gameState == "post-game" && currState.winner == p.name) {
        ctx.fillStyle = COLOURS.winnerBackground;
    }
    ctx.fillRect(left, top, innerWidth, innerWidth);

    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.font = "10px 'Consolas', monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLOURS.normalName;
    let name = p.name;
    if (gameState == "post-game" && currState.winner == p.name) {
        ctx.lineWidth = 2;
        ctx.fillStyle = COLOURS.winnerName;
        name = `👑${p.name}👑`;
    }
    const NAME_CUTOFF = 10;
    if(name.length > NAME_CUTOFF){
        let arr = name = name.split('');
        arr.splice(Math.floor(name.length/2), 0, '\n');
        name = arr.join('');
    }
    name = name.split('\n');
    for(let i = 0; i < name.length; i++){
        ctx.fillText(name[i], middle, top + MARGIN + 10*i, innerWidth);
    }

    ctx.textBaseline = "bottom";

    ctx.fillStyle = COLOURS.hpStat;
    ctx.textAlign = "left";
    ctx.fillText(`${p.hp}`, left + MARGIN, bottom - MARGIN, innerWidth);

    ctx.fillStyle = COLOURS.apStat;
    ctx.textAlign = "center";
    ctx.fillText(`${p.ap}`, middle, bottom - MARGIN, innerWidth);

    ctx.fillStyle = COLOURS.rangeStat;
    ctx.textAlign = "right";
    ctx.fillText(`${p.range}`, right - MARGIN, bottom - MARGIN, innerWidth);
}

const ui = document.querySelector("div.clickedSquareUi");

function drawSelectedUi() {
    if (!loggedInUname || selectedSquare == null || ui.style.display == "") { return; }

    const dialogWidth = ui.clientWidth;
    const dialogHeight = ui.clientHeight;

    let x = originX + selectedSquare.c * squareSide + squareSide / 2 - dialogWidth / 2;
    if (x < 0) { x = originX + selectedSquare.c * squareSide; }
    else if (x + dialogWidth >= width) { x = originX + selectedSquare.c * squareSide + squareSide - dialogWidth; }
    // if(x < 5){ x = 5; }
    // else if(x + dialogWidth >= width-5){ x = width - dialogWidth - 5; }
    let y = originY + selectedSquare.r * squareSide - dialogHeight - 5;
    if (y <= 0) {
        y = originY + selectedSquare.r * squareSide + squareSide + 5;
    }

    ui.style.left = x + "px";
    ui.style.top = y + "px";
}

function draw() {
    ctx.fillStyle = COLOURS.gridBackground;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = COLOURS.gridLines;
    ctx.lineWidth = 1;
    for (let i = 0; i <= dim; i++) {
        ctx.beginPath();
        ctx.moveTo(originX + i * squareSide, originY);
        ctx.lineTo(originX + i * squareSide, originY + gridSide);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(originX, originY + i * squareSide);
        ctx.lineTo(originX + gridSide, originY + i * squareSide);
        ctx.stroke();
    }

    if (loggedInUname && currState.players[loggedInUname].hp > 0) { /// highlight the player's range
        let playerPos = currState.players[loggedInUname].pos;
        let playerRange = currState.players[loggedInUname].range;

        ctx.strokeStyle = COLOURS.thisPlayerRangeBorder;
        ctx.lineWidth = 2;
        ctx.fillStyle = COLOURS.thisPlayerRangeFill;
        ctx.beginPath();
        ctx.rect(
            originX + (playerPos.c - playerRange) * squareSide,
            originY + (playerPos.r - playerRange) * squareSide,
            squareSide * (playerRange * 2 + 1),
            squareSide * (playerRange * 2 + 1)
        );
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }
    /// highlight the selected player's range
    if (selectedSquare && currState.grid[selectedSquare] != null && currState.grid[selectedSquare] != loggedInUname) {
        let playerPos = currState.players[currState.grid[selectedSquare]].pos;
        let playerRange = currState.players[currState.grid[selectedSquare]].range;

        ctx.strokeStyle = COLOURS.selPlayerRangeBorder;
        ctx.lineWidth = 2;
        ctx.fillStyle = COLOURS.selPlayerRangeFill;
        ctx.beginPath();
        ctx.rect(
            originX + (playerPos.c - playerRange) * squareSide,
            originY + (playerPos.r - playerRange) * squareSide,
            squareSide * (playerRange * 2 + 1),
            squareSide * (playerRange * 2 + 1)
        );
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }

    for (let r = 0; r < dim; r++) {
        for (let c = 0; c < dim; c++) {
            let x = originX + c * squareSide, y = originY + r * squareSide;
            if (loggedInUname && currState.players[loggedInUname].hp > 0) {
                /// highlight reachable
                if ((distsFromPlayer[r][c] <= currState.players[loggedInUname].ap)) {
                    ctx.fillStyle = COLOURS.reachableSquareFill;
                    ctx.fillRect(x, y, squareSide, squareSide);
                }
            }

            if (currState.grid[r][c] != null) {
                const p = currState.players[currState.grid[r][c]];
                if (p.hp > 0) {
                    drawPlayer(p);
                }
            }
            if (selectedSquare != null && selectedSquare.r == r && selectedSquare.c == c) {
                ctx.strokeStyle = COLOURS.selctedSquareBorder;
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, squareSide, squareSide);
            }
        }
    }

    if (gameState == "in-game" && loggedInUname && currState.players[loggedInUname].hp <= 0) {
        let vote = currState.players[loggedInUname].vote;
        let text;
        if (vote == null) {
            text = `YOU HAVEN'T VOTED`;
            ctx.fillStyle = COLOURS.hasntVoted;
        } else {
            text = `CURRENT VOTE: ${vote}`;
            ctx.fillStyle = COLOURS.currentVote;
        }
        ctx.lineWidth = 1;
        ctx.font = "30px 'Consolas', monospace";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.fillText(text, width / 2, 5, width);
    }

    drawSelectedUi();
}

function updateSelectedMenu() {
    if (selectedSquare && loggedInUname && gameState == "in-game") {
        const imAlive = (currState.players[loggedInUname].hp > 0);
        const selSqOccupied = (currState.grid[selectedSquare] != null);
        const selSqIsMe = (currState.grid[selectedSquare] == loggedInUname);
        const selSqIsOtherPlayer = (selSqOccupied && currState.grid[selectedSquare] != loggedInUname);
        const selSqInRange = (imAlive && Coord.ringDist(selectedSquare, currState.players[loggedInUname].pos) <= currState.players[loggedInUname].range);
        const selSqReachable = (imAlive && distsFromPlayer[selectedSquare] <= currState.players[loggedInUname].ap);
        const ap = currState.players[loggedInUname].ap;

        let allDisabled = true;
        allDisabled &= ui.querySelector("button#moveButton").disabled = !(selSqReachable && !selSqOccupied && imAlive);
        allDisabled &= ui.querySelector("button#attackButton").disabled = !(selSqInRange && selSqIsOtherPlayer && (ap >= 1) && imAlive);
        allDisabled &= ui.querySelector("button#giveButton").disabled = !(selSqInRange && selSqIsOtherPlayer && (ap >= 1) && imAlive);
        allDisabled &= ui.querySelector("button#upgradeButton").disabled = !(selSqIsMe && (ap >= 2) && imAlive);
        allDisabled &= ui.querySelector("button#voteButton").disabled = !(selSqIsOtherPlayer && !imAlive);
        ui.style.display = (allDisabled ? "" : "block");

        if (!ui.querySelector("button#voteButton").disabled) {
            if (currState.players[loggedInUname].vote == currState.grid[selectedSquare]) {
                ui.querySelector("button#voteButton").innerHTML = "❎";
            } else {
                ui.querySelector("button#voteButton").innerHTML = "✅";
            }
        }
    } else {
        ui.querySelector("button#moveButton").disabled = true;
        ui.querySelector("button#attackButton").disabled = true;
        ui.querySelector("button#giveButton").disabled = true;
        ui.querySelector("button#upgradeButton").disabled = true;
        ui.querySelector("button#voteButton").disabled = true;
        ui.style.display = "";
    }
}

function handleClick(cx, cy) {
    const x = cx - originX, y = cy - originY;
    let pos = new Coord(Math.floor(y / squareSide), Math.floor(x / squareSide));

    if (selectedSquare != null && selectedSquare.equals(pos)) {
        selectedSquare = null;
    } else {
        selectedSquare = pos;
    }
    updateSelectedMenu();

    draw();
}

let panStartCoords = null;
let panOffset = null, originBeforePan = null;
let panningTouch = null;

function addCanvasListeners() {
    ctx.canvas.addEventListener("click", ev => {
        handleClick(ev.clientX - canvasX, ev.clientY - canvasY);
    })
    ctx.canvas.addEventListener("touchstart", ev => {
        if (ev.touches.length != 1) { return; }
        panningTouch = ev.touches[0].identifier;
        panStartCoords = { x: ev.touches[0].clientX - canvasX, y: ev.touches[0].clientY - canvasY };
        panOffset = { x: 0, y: 0 };
        originBeforePan = { x: originX, y: originY };
    });
    ctx.canvas.addEventListener("touchmove", ev => {
        ev.preventDefault();
        for (const touch of ev.changedTouches) {
            if (touch.identifier != panningTouch) { continue }
            panOffset.x = touch.clientX - canvasX - panStartCoords.x;
            panOffset.y = touch.clientY - canvasY - panStartCoords.y;
            originX = originBeforePan.x + panOffset.x;
            originY = originBeforePan.y + panOffset.y;
            boundOrigin();
            draw();
        }
    });
    ctx.canvas.addEventListener("touchcancel", ev => {
        for (const touch of ev.changedTouches) {
            if (touch.identifier != panningTouch) { continue }
            console.warn("touch canceled: ", ev);
            panningTouch = null;
            panStartCoords = null;
            panOffset = null;
            originX = originBeforePan.x;
            originY = originBeforePan.y;
            originBeforePan = null;
            boundOrigin();
            draw();
        }
    });
    ctx.canvas.addEventListener("touchend", ev => {
        for (const touch of ev.changedTouches) {
            if (touch.identifier != panningTouch) { continue }
            panningTouch = null;
            panStartCoords = null;
            panOffset = null;
            originBeforePan = null;
        }
    });
}

function parseMessage({ data }) {
    let msg = JSON.parse(data);
    if (msg.type == "gameState") {
        currState = JSON.parse(msg.state);
        for (const p in currState.players) {
            const oldPos = currState.players[p].pos;
            currState.players[p].pos = crd(oldPos);
        }
        currState.grid = Grid.deserialise(currState.grid);
        dim = currState.dim;
        console.log(currState);
        setup();
    } else if (msg.type == "updates") {
        msg.updates.forEach(u => {
            if (u.stat == "pos") {
                currState.grid[currState.players[u.player].pos] = null;
                if (u.val == null) {
                    currState.players[u.player].pos = null;
                } else {
                    const newCoord = crd(u.val);
                    currState.players[u.player].pos = newCoord;
                    currState.grid[newCoord] = u.player;
                }
                if (loggedInUname != null && currState.players[loggedInUname].pos != null) {
                    distsFromPlayer = currState.grid.getDistsFromPos(currState.players[loggedInUname].pos);
                }
            } else {
                currState.players[u.player][u.stat] = u.val;
            }
        });
    } else if (msg.type == "winner") {
        location.href = "/list";
    } else if (msg.type == "error") {
        showErrorModal(msg.msg, null);
    }
    draw();
    updateSelectedMenu();
}

function attackModalSubmitted() {
    const amount = Number(getActiveModalBkg().querySelector("input.amount").value);
    ws.send(JSON.stringify({
        "type": "attack",
        "patient": currState.grid[selectedSquare],
        "amount": amount
    }));
    closeModal();
}

function giveModalSubmitted() {
    const amount = Number(getActiveModalBkg().querySelector("input.amount").value);
    ws.send(JSON.stringify({
        "type": "give",
        "patient": currState.grid[selectedSquare],
        "amount": amount
    }));
    closeModal();
}

function upgradeModalSubmitted() {
    const amount = Number(getActiveModalBkg().querySelector("input.amount").value);
    ws.send(JSON.stringify({
        "type": "upgrade",
        "amount": amount
    }));
    closeModal();
}

function attackButtonPressed(askAmount = false) {
    const maxAmount = currState.players[loggedInUname].ap;
    if (maxAmount < 0) { return; }
    if (!askAmount) {
        ws.send(JSON.stringify({
            "type": "attack",
            "patient": currState.grid[selectedSquare],
            "amount": 1
        }));
        return;
    }
    const modalBkg = document.querySelector("div.modalBkg#attackModalBkg");
    modalBkg.querySelector("input.amount").max = maxAmount;
    openModal(modalBkg);
}

function giveButtonPressed(askAmount = false) {
    const maxAmount = currState.players[loggedInUname].ap;
    if (maxAmount < 0) { return; }
    if (!askAmount) {
        ws.send(JSON.stringify({
            "type": "give",
            "patient": currState.grid[selectedSquare],
            "amount": 1
        }));
        return;
    }
    const modalBkg = document.querySelector("div.modalBkg#giveModalBkg");
    modalBkg.querySelector("input.amount").max = maxAmount;
    openModal(modalBkg);
}

function moveButtonPressed() {
    ws.send(JSON.stringify({
        type: "move",
        coord: selectedSquare.toString()
    }));
}

function voteButtonPressed() {
    let vote = currState.grid[selectedSquare];
    if (currState.players[loggedInUname].vote == vote) {
        vote = null;
    }
    ws.send(JSON.stringify({
        type: "vote",
        patient: vote
    }));
}

function upgradeButtonPressed(askAmount = false) {
    const maxAmount = Math.floor(currState.players[loggedInUname].ap / 2);
    if (maxAmount < 0) { return; }
    if (!askAmount) {
        ws.send(JSON.stringify({
            "type": "upgrade",
            "amount": 1
        }));
        return;
    }
    const modalBkg = document.querySelector("div.modalBkg#upgradeModalBkg");
    modalBkg.querySelector("input.amount").max = maxAmount;
    openModal(modalBkg);
}

function addSingleAndDblClickListener(element, clickListener, dblClickListener) {
    element.addEventListener("click", ev1 => {
        if (element.bigListenerDisabled) { return; }
        element.clickedAgain = false;
        let func = () => {
            element.clickedAgain = true;
            dblClickListener();
        };
        element.addEventListener("click", func, { once: true });
        element.bigListenerDisabled = true;
        setTimeout(() => {
            element.bigListenerDisabled = false;
            if (!element.clickedAgain) {
                clickListener();
            }
            element.removeEventListener("click", func)
        }, 250);
    });
}

function addSelectedMenuListeners() {
    ui.querySelector("button#moveButton").addEventListener("click", () => { moveButtonPressed(); });
    addSingleAndDblClickListener(ui.querySelector("button#attackButton"), () => attackButtonPressed(true), () => attackButtonPressed(false));
    addSingleAndDblClickListener(ui.querySelector("button#giveButton"), () => giveButtonPressed(true), () => giveButtonPressed(false));
    addSingleAndDblClickListener(ui.querySelector("button#upgradeButton"), () => upgradeButtonPressed(true), () => upgradeButtonPressed(false));
    ui.querySelector("button#voteButton").addEventListener("click", () => { voteButtonPressed(); });
}

function errorModalOKClicked() {
    if (typeof errorModalOKFunction == "function") {
        errorModalOKFunction();
    }
    closeModal();
}

function showErrorModal(errorText, okFunction) {
    const modalBkg = document.querySelector("div#errorModalBkg");
    modalBkg.querySelector("p.modalError").innerText = `${errorText}`;
    errorModalOKFunction = okFunction;
    openModal(modalBkg);
}

/**
 * 
 * @param {CanvasRenderingContext2D} _ctx
*/
export async function gamePageInit(_ctx, _width, _height) {
    ctx = _ctx;
    width = _width;
    height = _height;

    let loadingAnimationInterval = setInterval(() => {
        ctx.fillStyle = COLOURS.gridBackground;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = COLOURS.normalPlayerBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let d = new Date();
        let start = (d.getSeconds() + d.getMilliseconds() / 1000) * 5;
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 5, start, start + 2, true);
        ctx.stroke();
    }, 250);

    ws = new WebSocket(`${location.protocol.replace("http", "ws")}//${location.host}/api/ws`);
    ws.addEventListener("open", () => {
        clearInterval(loadingAnimationInterval);

        addCanvasListeners();
        addSelectedMenuListeners();
        document.querySelector("div#errorModalBkg button#errorModalOKButton").addEventListener("click", errorModalOKClicked);

        ws.addEventListener("message", parseMessage);
        const inCaseOfEmergency = () => {
            showErrorModal("Connection error, reload page.", location.reload.bind(location));
        };
        ws.addEventListener("error", inCaseOfEmergency);
        ws.addEventListener("close", inCaseOfEmergency);
    });
}