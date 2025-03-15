document.body.addEventListener("processedIncludes", async () => {
    let gameState = await getGameState();

    if(gameState == "registration"){
        document.querySelector("nav ul li.nav-element-game").remove();
    }

    let reg = /^\/([a-z-]+)(\.html)?$/;
    let currentPage = location.pathname.match(reg)[1];
    document.querySelector(`nav ul li.nav-element-${currentPage}`).classList.add("selected");
});