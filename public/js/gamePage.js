import Coord from "../../lib/coord.js";
import Grid from "../../lib/grid.js";

let ws = null;
/**
 * @type {HTMLDivElement}
*/
let canvasGrid = null;
let dim = null;

let currState = null;

function setup(){
    let dim = 7;
    canvasGrid.style.setProperty("--dim", dim);
    canvasGrid.style.setProperty("--square-side", "60px"); /// TODO

    for(let r = 0; r < dim; r++){
        for(let c = 0; c < dim; c++){
            let small = document.createElement("div");
            small.classList.add("grid-square");
            small.setAttribute("data-row", r);
            small.setAttribute("data-col", c);
            small.style.gridRow = r+1;
            small.style.gridColumn = c+1;
            canvasGrid.appendChild(small);

            if(currState.grid[r][c] != null){
                small.appendChild(playetToTankDiv(currState.players[currState.grid[r][c]]));
            }
        }
    }
}

function playetToTankDiv(player){
    let div = document.createElement("div");
    div.classList.add("player-div");
    div.id = `playerDiv_${player.name}`;
    div.innerHTML = `
        <div class="player-name">${/*player.name*/"_mariika.com_"}</div>
        <div class="player-stats">
            <div class="player-health">${player.hp}0</div>
            <div class="player-ap">${player.ap}0</div>
            <div class="player-range">${player.range}0</div>
        </div>
    `;
    return div;    
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
        // dim = 30;
        console.log(currState);
        setup();
    }else if(msg.type == "update"){
        console.log(msg);
        /// TODO
    }
}

export async function gamePageInit(_canvasGrid) {
    canvasGrid = _canvasGrid;
    
    let loadingAnimationInterval = setInterval(()=>{
        /// TODO: loading animation
    }, 250);

    ws = new WebSocket(`${location.protocol == "https:"?"wss:":"ws:"}//${location.host}/api/ws`);
    ws.addEventListener("open", ()=>{
        clearInterval(loadingAnimationInterval);

        ws.addEventListener("message", parseMessage);
        ws.addEventListener("error", ()=>{
            alert("Connection error, reload page.");
            location.reload();
        })
    });
}

/// TODO