import { Rectangle, getCutTiles } from "utils/minCut";
import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class RampartThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.rcl < 3) {
      return;
    }
    const spawn = this.idea.spawn;
    // Protect spawn
    creationIdea.addBuild(spawn.pos, STRUCTURE_RAMPART, 3, true, true);

    // Protect controller
    const controller = this.idea.spawn.room.controller;
    if (controller) {
      const controllerNeighbors = controller.pos.availableNeighbors(true);
      creationIdea.addBuilds(controllerNeighbors, STRUCTURE_RAMPART, 4, false, true, true);
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
    creationIdea.addBuilds(towerPos, STRUCTURE_RAMPART, 5, false, true, true);

    // Protect base
    const rect: Rectangle[] = [];
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);
    if (pivotPos) {
      const xDelta = Math.abs(pivotPos.x - this.idea.spawn.pos.x);
      const yDelta = Math.abs(pivotPos.y - this.idea.spawn.pos.y);
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
    for (const pos of positions) {
      creationIdea.addBuild(pos, STRUCTURE_RAMPART, 6, true, true);
    }
  }
}
