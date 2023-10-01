export default class Player {
    constructor(uname, pwd, displayName, color){
        this.uname = uname;
        this.pwd = pwd;
        // throw new Error("Proper auth - TODO");
        this.displayName = displayName;
        this.color = color;
    }
};