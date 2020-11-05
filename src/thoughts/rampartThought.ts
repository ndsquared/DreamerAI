import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class RampartThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    this.idea.addBuild([spawn.pos], STRUCTURE_RAMPART, 3);
    const controller = this.idea.spawn.room.controller;
    if (controller) {
      const controllerNeighbors = controller.pos.availableNeighbors(true);
      this.idea.addBuild(controllerNeighbors, STRUCTURE_RAMPART, 4);
    }
  }
}
