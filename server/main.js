import { initDB, saveDB } from "./lib_db.js";
import Game from "./game.js";

initDB();

// main

setInterval(saveDB, 2 * 60 * 1000);