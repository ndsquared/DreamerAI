import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class ContainerThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const spawn = this.idea.spawn;
    if (spawn) {
      const containers = spawn.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      if (containers.length === 0) {
        // Build container next to spawn
        const containerPositions = this.getPositionsStandard(this.idea.spawn.pos);
        creationIdea.addBuilds(containerPositions, STRUCTURE_CONTAINER, 4, true, false);
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
        const priority = PathFindWithRoad(spawn.pos, controller.pos).cost;
        creationIdea.addBuilds(buildPositions, STRUCTURE_CONTAINER, priority, true, false);
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
          const priority = PathFindWithRoad(spawn.pos, source.pos).cost;
          creationIdea.addBuilds(buildPositions, STRUCTURE_CONTAINER, priority, true, false);
        }
      }
    }
  }
}
