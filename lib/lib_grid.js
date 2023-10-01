import Coord from "../lib/lib_coord.js"
const { isCoord, getCoord } = Coord;
export default class Grid {
    constructor(dim, initVal=null) {
        this.dim = dim;
        this.grid = Array(dim).fill(Array(dim).fill(initVal));
        return new Proxy(this, {
            get: function (target, prop) {
                if (isCoord(prop)) {
                    let propc = getCoord(prop);
                    if (propc.inBounds(this.dim)) {
                        return target.getVal(propc);
                    }
                }
                return target[prop];
            },
            set: function (target, prop, val) {
                if (isCoord(prop)) {
                    let propc = getCoord(prop);
                    if (propc.inBounds(this.dim)) {
                        return target.setVal(propc, val);
                    }
                }
                return target[prop] = val;
            }
        });
    }
    getVal(coord) {
        return this.grid[coord.r][coord.c];
    }
    setVal(coord, val) {
        return this.grid[coord.r][coord.c] = val;
    }
}