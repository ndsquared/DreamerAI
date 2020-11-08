import { Rectangle, getCutTiles } from "utils/minCut";
import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class RampartThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(): void {
    if (this.idea.rcl < 3) {
      return;
    }
    const spawn = this.idea.spawn;
    // Protect spawn
    this.idea.addBuilds([spawn.pos], STRUCTURE_RAMPART, 3, true, true);

    // Protect controller
    const controller = this.idea.spawn.room.controller;
    if (controller) {
      const controllerNeighbors = controller.pos.availableNeighbors(true);
      this.idea.addBuilds(controllerNeighbors, STRUCTURE_RAMPART, 4, false, true);
    }

    // Protect towers
    const towers = spawn.room.find(FIND_STRUCTURES, {
      filter: s => {
        if (s.structureType === STRUCTURE_TOWER) {
          return true;
        }
        return false;
      }
    });
    const towerPos = _.map(towers, t => t.pos);
    this.idea.addBuilds(towerPos, STRUCTURE_RAMPART, 5, false, true);

    // Protect base
    // let cpu = Game.cpu.getUsed();
    const rect: Rectangle[] = [];
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);
    if (pivotPos) {
      const xDelta = Math.abs(pivotPos.x - this.idea.spawn.pos.x);
      const yDelta = Math.abs(pivotPos.y - this.idea.spawn.pos.y);
      // console.log(`xDelta: ${xDelta}, yDelta: ${yDelta}`);
      let basePadding: number;
      if (xDelta) {
        basePadding = xDelta + 4;
      } else {
        basePadding = yDelta + 4;
      }
      rect.push({
        x1: this.idea.spawn.pos.x - basePadding,
        y1: this.idea.spawn.pos.y - basePadding,
        x2: this.idea.spawn.pos.x + basePadding,
        y2: this.idea.spawn.pos.y + basePadding
      });
    }

    const positions = getCutTiles(this.idea.spawn.room.name, rect, true, Infinity, false);
    // const rv = new RoomVisual(this.idea.spawn.room.name);
    for (const pos of positions) {
      // rv.circle(pos, { radius: 0.5, fill: "#00ff00" });
      this.idea.addBuild(pos, STRUCTURE_RAMPART, 6, true);
    }

    // cpu = Game.cpu.getUsed() - cpu;
    // console.log(`CPU time: ${cpu} | Positions: ${positions.length}`);
  }
}
