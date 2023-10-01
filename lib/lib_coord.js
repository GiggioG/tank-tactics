export default class Coord {
    constructor(r, c) {
        this.r = r;
        this.c = c;
    }
    toString(){
        return `${this.r},${this.c}`;
    }
    inBounds(dim){
        if (this.r < 0 || this.r >= dim) { return false; }
        if (this.c < 0 || this.c >= dim) { return false; }
        return true;
    }
    getNeigh() {
        return [
            new Coord(pos.r - 1, pos.c     ),
            new Coord(pos.r    , pos.c + 1 ),
            new Coord(pos.r + 1, pos.c     ),
            new Coord(pos.r    , pos.c - 1 )
        ];
    }
    static dist(a, b){
        let diffR = Math.abs(b.r - a.r);
        let diffC = Math.abs(b.c - a.c);
        return diffR + diffC;
    }
    static isCoord(str){
        const regex = /^(-?\d+),(-?\d+)$/;
        return regex.test(str);
    }
    static getCoord(str){
        const regex = /^(-?\d+),(-?\d+)$/;
        let res =  regex.exec(str);
        return new Coord(res[1], res[2]);
    }
}