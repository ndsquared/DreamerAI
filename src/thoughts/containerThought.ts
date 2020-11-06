import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class ContainerThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    if (spawn) {
      const containers = spawn.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      if (containers.length === 0) {
        // Build container next to spawn
        const containerDeltas: Coord[] = [];
        containerDeltas.push({ x: 1, y: 1 });
        containerDeltas.push({ x: 1, y: -1 });
        containerDeltas.push({ x: -1, y: -1 });
        containerDeltas.push({ x: -1, y: 1 });
        const containerPositions = this.getPositionsFromDelta(this.idea.spawn.pos, containerDeltas);
        this.idea.addBuild(containerPositions, STRUCTURE_CONTAINER, 4);
      }
    }

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

    // Build container next to all the sources in the neighborhood
    for (const room of spawn.room.neighborhood) {
      const sources = room.find(FIND_SOURCES);
      for (const source of sources) {
        const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
          filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        if (containers.length === 0) {
          const buildPositions = source.pos.availableNeighbors(true);
          this.idea.addBuild(
            buildPositions,
            STRUCTURE_CONTAINER,
            _.min([PathFindWithRoad(spawn.pos, source.pos).cost, 10])
          );
        }
      }
    }
  }
}
