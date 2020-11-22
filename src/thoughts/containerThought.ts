import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "./thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class ContainerThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    const baseOriginPos = this.idea.hippocampus.getBaseOriginPos(room.name);
    if (!room.storage) {
      if (this.idea.hippocampus.spawnContainers.length === 0) {
        // Build container next to spawn
        const containerPositions = this.getPositionsStandard(baseOriginPos);
        creationIdea.addBuilds(containerPositions, STRUCTURE_CONTAINER, 4, true, false);
      }
    }

    // Build container next to controller
    const controller = room.controller;
    if (controller && controller.my) {
      if (this.idea.hippocampus.controllerContainers.length === 0) {
        const buildPositions = controller.pos.availableAdjacentBuilds();
        const priority = PathFindWithRoad(baseOriginPos, controller.pos).cost;
        creationIdea.addBuilds(buildPositions, STRUCTURE_CONTAINER, priority, true, false);
      }
    }

    // Build container next to all the sources in the neighborhood
    for (const source of this.idea.hippocampus.sources) {
      if (this.idea.hippocampus.sourceContainers[source.id].length === 0) {
        const buildPositions = source.pos.availableAdjacentBuilds();
        const priority = PathFindWithRoad(baseOriginPos, source.pos).cost;
        creationIdea.addBuilds(buildPositions, STRUCTURE_CONTAINER, priority, true, false);
      }
    }
  }
}
