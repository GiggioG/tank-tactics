function gamePageInit(){    
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, width, height);
    const TIMES = 12;
    for (let i = 0; i < TIMES; i++) {
        for (let j = 0; j < TIMES; j++) {
            ctx.fillStyle = `rgb(0, ${i * 255 / TIMES}, ${j * 255 / TIMES})`;
            ctx.fillRect(i * width / TIMES, j * height / TIMES, width / TIMES, height / TIMES);
        }
    }
}

/// TODO