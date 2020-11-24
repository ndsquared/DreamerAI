import { Rectangle, getCutTiles } from "utils/minCut";
import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "./thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class RampartThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.rcl < 3) {
      return;
    }
    const room = this.idea.room;
    if (!room) {
      return;
    }
    const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
    // Protect spawn
    creationIdea.addBuild(baseOriginPos, STRUCTURE_RAMPART, 3, false, false);

    // Protect controller
    const controller = room.controller;
    if (controller) {
      const controllerNeighbors = controller.pos.availableAdjacentPositions(true);
      creationIdea.addBuilds(controllerNeighbors, STRUCTURE_RAMPART, 4, true, false, false);
    }

    // Protect containers
    const containerPos = _.map(this.idea.roomObjects.containers, c => c.pos);
    creationIdea.addBuilds(containerPos, STRUCTURE_RAMPART, 7, false, false, false);

    // Protect links
    const linkPos = _.map(this.idea.roomObjects.links, l => l.pos);
    creationIdea.addBuilds(linkPos, STRUCTURE_RAMPART, 7, false, false, false);

    // Protect towers
    const towerPos = _.map(this.idea.baseRoomObjects.towers, t => t.pos);
    creationIdea.addBuilds(towerPos, STRUCTURE_RAMPART, 5, false, false, false);

    // Protect base
    const rect: Rectangle[] = [];
    const pivotPos = this.getNextPivotPosStandard(baseOriginPos, 3);
    if (pivotPos) {
      const xDelta = Math.abs(pivotPos.x - baseOriginPos.x);
      const yDelta = Math.abs(pivotPos.y - baseOriginPos.y);
      let basePadding: number;
      if (xDelta) {
        basePadding = xDelta + 4;
      } else {
        basePadding = yDelta + 4;
      }
      rect.push({
        x1: baseOriginPos.x - basePadding,
        y1: baseOriginPos.y - basePadding,
        x2: baseOriginPos.x + basePadding,
        y2: baseOriginPos.y + basePadding
      });
    }

    const positions = getCutTiles(room.name, rect, true, Infinity, false);
    for (const pos of positions) {
      creationIdea.addBuild(pos, STRUCTURE_RAMPART, 6, true, false);
    }
  }
}
