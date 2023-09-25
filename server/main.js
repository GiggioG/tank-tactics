const { initDB, saveDB } = require("./lib_db.js");

initDB();

// main

setInterval(saveDB, 2 * 60 * 1000);