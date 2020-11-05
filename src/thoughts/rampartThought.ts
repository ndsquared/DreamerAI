import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class RampartThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    // Protect spawn
    this.idea.addBuild([spawn.pos], STRUCTURE_RAMPART, 3);

    // Protect controller
    const controller = this.idea.spawn.room.controller;
    if (controller) {
      const controllerNeighbors = controller.pos.availableNeighbors(true);
      this.idea.addBuild(controllerNeighbors, STRUCTURE_RAMPART, 4);
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
    this.idea.addBuild(towerPos, STRUCTURE_RAMPART, 5);

    // Protect base
  }
}
