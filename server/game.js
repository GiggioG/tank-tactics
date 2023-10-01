import Queue from "../lib/lib_queue.js";
import Coord from "../lib/lib_coord.js";
const { dist } = Coord;
const crd = () => new Coord(...arguments);
import Grid from "../lib/lib_grid.js";

function spreadPlayers(count, dims) {
    throw new Error("TODO");
    /// algoritum za opredelqne poziciite na count igracha v pole dims na dims
    return [crd(0, 0), crd(1, 0)];
}

const SUCCESS = { success: true, error: null };

export default class Game {
    constructor(users, dim) {
        this.dim = dim;
        this.grid = new Grid(dim);
        let positions = spreadPlayers(users.length, dim);
        this.players = {};
        users.forEach((uname, idx) => {
            this.players[uname] = {
                name: uname,
                hp: 3,
                ap: 1,
                range: 2,
                pos: positions[idx],
                vote: null
            };
            this.grid[positions[idx]] = uname;
        });
    }
    _routeDist(from, to) {
        /// bfs
        let dists = new Grid(this.dim, Infinity);
        let front = new Queue();
        front.push({ pos: from, dist: 0 });
        while (dists[to] == Infinity && !front.isEmpty()) {
            const { pos, dist } = front.pop();
            if (dist < dists[pos]) {
                dists[pos] = dist;
                pos.getNeigh()
                    .filter(e => e.inBounds(this.dim))
                    .filter(e => this.grid[e] == null)
                    .forEach(e => front.push({ pos: e, dist: dist + 1 }));
            }
        }
        return dists[to];
    }
    _move(agent, pos, routeLen) {
        this.grid[this.players[agent].pos] = null;
        this.grid[pos] = agent;
        this.players[agent].ap -= routeLen;
        this.players[agent].pos = pos;
    }
    tryMove(agent, pos) {
        if (!pos.inBounds(this.dim)) return {
            success: false,
            error: "That space is outside of the board."
        };
        if (this.grid[pos] != null) return {
            success: false,
            error: "That space is occupied."
        }
        let routeLen = this._routeDist(this.players[agent].pos, pos);
        if (routeLen > this.players[agent].ap) return {
            success: false,
            error: "Not enough AP to go that far."
        };

        this.move(agent, pos, routeLen);
        return { success: true, error: null };
    }
    _attack(agent, patient, amount) {
        this.players[agent].ap -= amount;
        this.players[patient].hp -= amount;
    }
    tryAttack(agent, patient, amount) {
        if (!this.players[patient]) return {
            success: false,
            error: "That player doesn't exist."
        };
        if (amount > this.players[agent].ap) return {
            success: false,
            error: "Not enough AP to attack that much."
        };
        if (dist(this.players[agent].pos, this.players[patient].pos) > this.players[agent].range) return {
            success: false,
            error: "Player is out of your range."
        };
        if (amount > this.players[patient].hp) return {
            success: false,
            error: "You can't over-attack (attack for more hp than your opponent has)."
        };

        this.attack(agent, patient, amount);
        return SUCCESS;
    }
    _give(agent, patient, amount) {
        this.players[agent].ap -= amount;
        this.players[patient].ap += amount;
    }
    tryGive(agent, patient, amount) {
        if (!this.players[patient]) return {
            success: false,
            error: "That player doesn't exist."
        };
        if (amount > this.players[agent].ap) return {
            success: false,
            error: "Not enough AP to give that much."
        };
        if (dist(this.players[agent].pos, this.players[patient].pos) > this.players[agent].range) return {
            success: false,
            error: "Player is out of your range."
        };

        this.give(agent, patient, amount);
        return SUCCESS;
    }
    _upgrade(agent, amount) {
        this.players[agent].ap -= amount * 2;
        this.players[agent].range += amount;
    }
    tryUpgrade(agent, amount) {
        if (amount * 2 > this.players[agent].ap) return {
            success: false,
            error: "Not enough AP to upgrade your range that much."
        };

        this.upgrade(agent, amount);
        return SUCCESS;
    }
    _vote(agent, patient) {
        this.players[agent].vote = patient;
    }
    tryVote(agent, patient) {
        if (this.players[agent].hp > 0) return {
            success: false,
            error: "You can't vote when still alive."
        };
        if (!this.players[patient]) return {
            success: false,
            error: "That player doesn't exist."
        };
        if (this.players[patient].hp <= 0) return {
            success: false,
            error: "That player is also dead."
        };
        this._vote(agent, patient);
        return SUCCESS;
    }
    _giveOutVoteAP() {
        let counts = {};
        for (uname in this.players) { counts[uname] = 0 }
        this.players.filter(p => (p.hp <= 0 && p.vote != null)).forEach(p => {
            counts[p.vote]++;
            this.players[p.name].vote = null;
        });
        for (uname in counts) {
            if (counts[uname] >= 3) { this.players[uname].ap++; }
        }
    }
    giveOutAP() {
        this._giveOutVoteAP();
        for (uname in this.players) {
            if (this.players[uname].hp > 0) {
                this.players[uname].ap++;
            }
        }
    }
}