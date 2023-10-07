import { initDB, saveDB } from "./lib_db.js";
import Game from "./game.js";

initDB();

// main

dim = 2*ceil(sqrt(players)) + 1

setInterval(saveDB, 2 * 60 * 1000);