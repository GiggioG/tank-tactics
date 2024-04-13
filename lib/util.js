// from https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj
export const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export const humanTimestamp = () => {
    return new Date().toLocaleString("af"); // I like yyyy-MM-dd hh:mm:ss
}