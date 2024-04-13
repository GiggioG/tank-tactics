import Coord from "./coord.js"
const { isCoord, getCoord } = Coord;
export default class Grid {
    constructor(dim, initVal=null) {
        if (arguments.length == 0) { return; } // intended to create an empty object to use with deserialise
        this.dim = dim;
        this.grid = Array(dim).fill(null).map(_=>Array(dim).fill(initVal));
        return new Proxy(this, {
            get: function (target, prop) {
                if (isCoord(prop)) {
                    let propc = getCoord(prop);
                    if (propc.inBounds(this.dim)) {
                        return target.getVal(propc);
                    }
                }else if(!isNaN(parseInt(prop))){
                    return target.grid[prop];
                }else{
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
                }else if(!isNaN(parseInt(prop))){
                    target.grid[prop] = val;
                    return true;
                }else{
                    target[prop] = val;
                    return true;
                }
            }
        });
    }
    serialise(){
        return JSON.stringify(this);
    }
    static deserialise(str){
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
}