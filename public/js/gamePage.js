import Coord from "../../lib/coord.js";
import Grid from "../../lib/grid.js";

let ws = null;
/**
 * @type {CanvasRenderingContext2D}
*/
let ctx = null;
let width = null, height = null;
let canvasX = null, canvasY = null;

let loadingAnimationInterval = null;

let currState = null;

let originX = null, originY = null;
let squareSide = null, gridSide = null;
let dim = null;

function boundOrigin(){
    let oldX = originX, oldY = originY;
    if(gridSide > width){
        if(originX > 0){ originX = 0; }
        if(originX + gridSide < width){ originX = width - gridSide; }
    }else{
        originX = width/2 - gridSide/2;
    }
    if(gridSide > height){
        if(originY > 0){ originY = 0; }
        if(originY + gridSide < height){ originY = height - gridSide; }
    }else{
        originY = height/2 - gridSide/2;
    }

    if(originX != oldX || originY != oldY){
        draw();
    }
}

function centerCoordinates(pos){
    originX = width/2 - (pos.c * squareSide) - squareSide/2;
    originY = height/2 - (pos.r * squareSide) - squareSide/2;
    
    boundOrigin();
}

function setup(){ /// drawing setup, name borrowed from p5.js
    let {x: cx, y: cy} = ctx.canvas.getBoundingClientRect();
    canvasX = cx;
    canvasY = cy;

    squareSide = Math.max(Math.min(width/dim, height/dim), 45);
    gridSide = squareSide * dim;
    
    if(loggedInUname){
        /// TODO
        let playerPos = currState.players[loggedInUname].pos;
        centerCoordinates(playerPos);
    }else{
        centerCoordinates(new Coord(Math.floor(dim/2), Math.floor(dim/2)));
    }

}

function draw(){
    ctx.fillStyle = "black"; ///colors
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "darkgrey"; ///colors
    ctx.lineWidth = 1;
    for(let i = 0; i <= dim; i++){
        ctx.beginPath();
        ctx.moveTo(originX + i*squareSide, originY);
        ctx.lineTo(originX + i*squareSide, originY + gridSide);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(originX, originY + i*squareSide);
        ctx.lineTo(originX + gridSide, originY + i*squareSide);
        ctx.stroke();
    }

    for(let r = 0; r < dim; r++){
        for(let c = 0; c < dim; c++){
            if(currState.grid[r][c] == null){ continue; }
            const p = currState.grid[r][c];
            ctx.fillStyle = `rgb(${currState.players[p].hp * 30}, 0, 0)`;
            ctx.fillRect(originX + c*squareSide, originY + r*squareSide, squareSide, squareSide);
        }
    }
}

function handleClick(cx, cy){
    ctx.strokeStyle = "red"; ///colors
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    console.log(cx, cy);
}

let panStartCoords = null;
let panOffset = null, originBeforePan = null;
let panningTouch = null;

function addCanvasListeners(){
    ctx.canvas.addEventListener("click", ev => {
        handleClick(ev.clientX - canvasX, ev.clientY - canvasY);
    })
    ctx.canvas.addEventListener("touchstart", ev => {
        if(ev.touches.length != 1){ return; /* TODO: zooming */ }
        panningTouch = ev.touches[0].identifier;
        panStartCoords = {x: ev.touches[0].clientX - canvasX, y: ev.touches[0].clientY - canvasY};
        panOffset = {x: 0, y: 0};
        originBeforePan = {x: originX, y: originY};
    });
    ctx.canvas.addEventListener("touchmove", ev => {
        ev.preventDefault();
        for(const touch of ev.changedTouches){
            if(touch.identifier != panningTouch){ continue }
            panOffset.x = touch.clientX-canvasX - panStartCoords.x;
            panOffset.y = touch.clientY-canvasY - panStartCoords.y;
            originX = originBeforePan.x + panOffset.x;
            originY = originBeforePan.y + panOffset.y;
            boundOrigin();
        }
    });
    ctx.canvas.addEventListener("touchcancel", ev => {
        for(const touch of ev.changedTouches){
            if(touch.identifier != panningTouch){ continue }
            panningTouch = null;
            panStartCoords = null;
            panOffset = null;
            originX = originBeforePan.x;
            originY = originBeforePan.y;
            originBeforePan = null;
            boundOrigin();
        }
    });
    ctx.canvas.addEventListener("touchend", ev => {
        for(const touch of ev.changedTouches){
            if(touch.identifier != panningTouch){ continue }
            panningTouch = null;
            panStartCoords = null;
            panOffset = null;
            originBeforePan = null;
        }
    });
}

function parseMessage({data}){
    let msg = JSON.parse(data);
    if(msg.type == "gameState"){
        currState = JSON.parse(msg.state);
        for(const p in currState.players){
            const oldPos = currState.players[p].pos;
            currState.players[p].pos = new Coord(oldPos.r, oldPos.c);
        }
        currState.grid = Grid.deserialise(currState.grid);
        dim = currState.dim;
        console.log(currState);
        setup();
    }else if(msg.type == "update"){

    }
    draw();
}

/**
 * 
 * @param {CanvasRenderingContext2D} _ctx
 */
export async function gamePageInit(_ctx, _width, _height) {
    ctx = _ctx;
    width = _width;
    height = _height;

    loadingAnimationInterval = setInterval(()=>{
        ctx.fillStyle = "black"; /// TODO - colours (vsichkite sa markirani s ///colors)
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "red"; ///colors
        ctx.strokeStyle = "blue"; ///colors
        ctx.lineWidth = 2;
        ctx.beginPath();
        let d = new Date();
        let start = (d.getSeconds() + d.getMilliseconds()/1000) * 5;
        ctx.arc(width/2, height/2, Math.min(width, height)/5, start, start + 2, true);
        ctx.stroke();
    }, 250);

    ws = new WebSocket(`${location.protocol == "https:"?"wss:":"ws:"}//${location.host}/api/ws`);
    ws.addEventListener("open", ()=>{
        clearInterval(loadingAnimationInterval);

        addCanvasListeners();

        ws.addEventListener("message", parseMessage);
        ws.addEventListener("error", ()=>{
            alert("Connection error, reload page.");
            location.reload();
        })
    });
}

/// TODO