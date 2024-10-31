import { Coord, crd } from "../../lib/coord.js";
import Grid from "../../lib/grid.js";

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

    if (loggedInUname) {
        let playerPos = currState.players[loggedInUname].pos;
        centerCoordinates(playerPos);

        distsFromPlayer = currState.grid.getDistsFromPos(playerPos);
    } else {
        centerCoordinates(new Coord(Math.floor(dim / 2), Math.floor(dim / 2)));
    }
}

function drawPlayer(p) {
    let x = originX + p.pos.c * squareSide, y = originY + p.pos.r * squareSide;

    ctx.fillStyle = "darkgreen"; ///colors
    ctx.fillRect(x, y, squareSide, squareSide);

    const BORDER_WIDTH = 3, MARGIN = 5; /// TODO: config

    const left = x + BORDER_WIDTH;
    const top = y + BORDER_WIDTH;
    const right = x + squareSide - BORDER_WIDTH;
    const bottom = y + squareSide - BORDER_WIDTH;
    const middle = x + squareSide / 2;
    const innerWidth = squareSide - 2 * BORDER_WIDTH;

    ctx.fillStyle = "black";
    ctx.fillRect(left, top, innerWidth, innerWidth);

    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "white"; ///colors
    ctx.fillText(p.name, middle, top + MARGIN, innerWidth);

    ctx.textBaseline = "bottom";

    ctx.fillStyle = "red"; ///colors
    ctx.textAlign = "left";
    ctx.fillText(`${p.hp}`, left + MARGIN, bottom - MARGIN, innerWidth);

    ctx.fillStyle = "lime"; ///colors
    ctx.textAlign = "center";
    ctx.fillText(`${p.ap}`, middle, bottom - MARGIN, innerWidth);

    ctx.fillStyle = "orange"; ///colors
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
    ctx.fillStyle = "black"; ///colors
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "darkgrey"; ///colors
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

    if (loggedInUname) { /// highlight the player's range
        let playerPos = currState.players[loggedInUname].pos;
        let playerRange = currState.players[loggedInUname].range;

        ctx.strokeStyle = "orange"; ///colors
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgb(255, 165, 0, 0.2)"; ///colors (orange, only with opacity)
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

        ctx.strokeStyle = "maroon"; ///colors
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgb(128, 0, 0, 0.2)"; ///colors (orange, only with opacity)
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
            if (loggedInUname) {
                /// highlight reachable
                if ((distsFromPlayer[r][c] <= currState.players[loggedInUname].ap)) {
                    ctx.fillStyle = "rgb(0, 0, 255, 0.3)";///colors
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
                ctx.strokeStyle = "yellow";///colors
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, squareSide, squareSide);
            }
        }
    }

    drawSelectedUi();
}

function handleClick(cx, cy) {
    const x = cx - originX, y = cy - originY;
    let pos = new Coord(Math.floor(y / squareSide), Math.floor(x / squareSide));

    if (selectedSquare != null && selectedSquare.equals(pos)) {
        selectedSquare = null;
    } else {
        selectedSquare = pos;

        if (loggedInUname) {
            const selSqOccupied = (currState.grid[selectedSquare] != null);
            const selSqIsMe = (currState.grid[selectedSquare] == loggedInUname);
            const selSqIsOtherPlayer = (selSqOccupied && currState.grid[selectedSquare] != loggedInUname);
            const selSqInRange = (Coord.ringDist(selectedSquare, currState.players[loggedInUname].pos) <= currState.players[loggedInUname].range);
            const selSqReachable = (distsFromPlayer[selectedSquare] <= currState.players[loggedInUname].ap);

            let allDisabled = true;
            allDisabled &= ui.querySelector("button#moveButton").disabled = !(selSqReachable && !selSqOccupied);
            allDisabled &= ui.querySelector("button#attackButton").disabled = !(selSqInRange && selSqIsOtherPlayer);
            allDisabled &= ui.querySelector("button#giveButton").disabled = !(selSqInRange && selSqIsOtherPlayer);
            allDisabled &= ui.querySelector("button#upgradeButton").disabled = !(selSqIsMe);
            ui.style.display = (allDisabled ? "" : "block");
        }
    }

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
        if (ev.touches.length != 1) { return; /* TODO: zooming */ }
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
            if(u.stat == "pos"){
                currState.grid[currState.players[u.player].pos] = null;
                if(u.val == null){
                    currState.players[u.player].pos = null;
                }else{
                    const newCoord = crd(u.val);
                    currState.players[u.player].pos = newCoord;
                    currState.grid[newCoord] = u.player;
                }
                if(loggedInUname != null){
                    distsFromPlayer = currState.grid.getDistsFromPos(currState.players[loggedInUname].pos);
                }
            }else{
                currState.players[u.player][u.stat] = u.val;
            }
        });
    }
    draw();
}

function attackButtonPressed(askAmount = false) {
    let amount = 1;
    if (askAmount) { amount = Number(prompt("Amount?")); } /// TODO: normal modal for attack, give, upgrade
    ws.send(JSON.stringify({
        "type": "attack",
        "patient": currState.grid[selectedSquare],
        "amount": amount
    }));
}

function giveButtonPressed(askAmount = false) {
    let amount = 1;
    if (askAmount) { amount = Number(prompt("Amount?")); }
    ws.send(JSON.stringify({
        "type": "give",
        "patient": currState.grid[selectedSquare],
        "amount": amount
    }));
}

function moveButtonPressed() {
    ws.send(JSON.stringify({
        type: "move",
        coord: selectedSquare.toString()
    }));
}

function upgradeButtonPressed(askAmount = false) {
    let amount = 1;
    if (askAmount) { amount = Number(prompt("Amount?")); }
    ws.send(JSON.stringify({
        type: "upgrade",
        amount: amount
    }));
}

/// TODO: ui for when you are dead
/// TODO: ui for when the game is ended.

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
        }, 200);
    });
}

function addSelectedMenuListeners() {
    ui.querySelector("button#moveButton").addEventListener("click", () => { moveButtonPressed(); });
    addSingleAndDblClickListener(ui.querySelector("button#attackButton"), () => attackButtonPressed(true), () => attackButtonPressed(false));
    addSingleAndDblClickListener(ui.querySelector("button#giveButton"), () => giveButtonPressed(true), () => giveButtonPressed(false));
    addSingleAndDblClickListener(ui.querySelector("button#upgradeButton"), () => upgradeButtonPressed(true), () => upgradeButtonPressed(false));
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
        ctx.fillStyle = "black"; /// TODO - colours (vsichkite sa markirani s ///colors)
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "red"; ///colors
        ctx.strokeStyle = "blue"; ///colors
        ctx.lineWidth = 2;
        ctx.beginPath();
        let d = new Date();
        let start = (d.getSeconds() + d.getMilliseconds() / 1000) * 5;
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 5, start, start + 2, true);
        ctx.stroke();
    }, 250);

    ws = new WebSocket(`${location.protocol == "https:" ? "wss:" : "ws:"}//${location.host}/api/ws`);
    ws.addEventListener("open", () => {
        clearInterval(loadingAnimationInterval);

        addCanvasListeners();
        addSelectedMenuListeners();

        ws.addEventListener("message", parseMessage);
        ws.addEventListener("error", () => {
            alert("Connection error, reload page.");
            location.reload();
        })
    });
}

/// TODO: add rulers with excel-like coordinates
/// TODO: add proper dialog for when an action fails
/// TODO: server console

/// TODO: will probably crash if logging in as dead player, fix that