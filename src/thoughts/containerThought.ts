import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class ContainerThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;

    // Build container next to controller
    const controller = spawn.room.controller;
    if (controller && controller.my) {
      const containers = controller.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      if (containers.length === 0) {
        const buildPositions = controller.pos.availableNeighbors(true);
        this.idea.addBuild(buildPositions, STRUCTURE_CONTAINER, 5);
      }
    }

    // Build container next to all the sources in the room
    const sources = _.sortBy(
      Game.rooms[spawn.pos.roomName].find(FIND_SOURCES),
      s => s.pos.findPathTo(spawn.pos, { ignoreCreeps: true }).length
    );
    let containerPriority = 3;
    for (const source of sources) {
      const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      if (containers.length === 0) {
        const buildPositions = source.pos.availableNeighbors(true);
        this.idea.addBuild(buildPositions, STRUCTURE_CONTAINER, containerPriority);
      }
      containerPriority++;
    }
  }
}
