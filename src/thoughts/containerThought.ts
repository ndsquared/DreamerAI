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
    if (spawn && !spawn.room.storage) {
      if (this.idea.hippocampus.spawnContainers.length === 0) {
        // Build container next to spawn
        const containerPositions = this.getPositionsStandard(this.idea.spawn.pos);
        creationIdea.addBuilds(containerPositions, STRUCTURE_CONTAINER, 4, true, false);
      }
    }

    // Build container next to controller
    const controller = spawn.room.controller;
    if (controller && controller.my) {
      if (this.idea.hippocampus.controllerContainers.length === 0) {
        const buildPositions = controller.pos.availableBuilds();
        const priority = PathFindWithRoad(spawn.pos, controller.pos).cost;
        creationIdea.addBuilds(buildPositions, STRUCTURE_CONTAINER, priority, true, false);
      }
    }

    // Build container next to all the sources in the neighborhood
    for (const source of this.idea.hippocampus.sources) {
      if (this.idea.hippocampus.sourceContainers[source.id].length === 0) {
        const buildPositions = source.pos.availableBuilds();
        const priority = PathFindWithRoad(spawn.pos, source.pos).cost;
        creationIdea.addBuilds(buildPositions, STRUCTURE_CONTAINER, priority, true, false);
      }
    }
  }
}
