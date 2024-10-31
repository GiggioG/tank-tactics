import { Coord } from "./coord.js"
const { isCoord, getCoord } = Coord;
import Queue from "./queue.js"
export default class Grid {
    constructor(dim, initVal = null) {
        if (arguments.length == 0) { return; } // intended to create an empty object to use with deserialise
        this.dim = dim;
        this.grid = Array(dim).fill(null).map(_ => Array(dim).fill(initVal));
        return new Proxy(this, {
            get: function (target, prop) {
                if (isCoord(prop)) {
                    let propc = getCoord(prop);
                    if (propc.inBounds(this.dim)) {
                        return target.getVal(propc);
                    }
                } else if (!isNaN(parseInt(prop))) {
                    return target.grid[prop];
                } else {
                    return target[prop];
                }
            },
            set: function (target, prop, val) {
                if (isCoord(prop)) {
                    let propc = getCoord(prop);
                    if (propc.inBounds(this.dim)) {
                        target.setVal(propc, val);
                        return true;
                    }
                } else if (!isNaN(parseInt(prop))) {
                    target.grid[prop] = val;
                    return true;
                } else {
                    target[prop] = val;
                    return true;
                }
            }
        });
    }
    serialise() {
        return JSON.stringify(this);
    }
    static deserialise(str) {
        let obj = JSON.parse(str);
        let ret = new Grid(obj.dim);
        ret.grid = obj.grid;
        return ret;
    }
    getVal(coord) {
        return this.grid[coord.r][coord.c];
    }
    setVal(coord, val) {
        return this.grid[coord.r][coord.c] = val;
    }
    getDistsFromPos(from) {
        /// bfs
        let dists = new Grid(this.dim, Infinity);
        let front = new Queue();
        front.push({ pos: from, dist: 0 });
        while (!front.isEmpty) {
            const { pos, dist } = front.pop();
            if (dist < dists[pos]) {
                dists[pos] = dist;
                pos.getNeigh()
                    .filter(e => e.inBounds(this.dim))
                    .filter(e => this.getVal(e) == null)
                    .forEach(e => front.push({ pos: e, dist: dist + 1 }));
            }
        }
        return dists;
    }
}