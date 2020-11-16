import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class RoadThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.rcl < 3) {
      return;
    }
    const spawn = this.idea.spawn;
    // Build roads around spawn
    const roadDeltas: Coord[] = this.cardinalDirections();
    const roadPositions: RoomPosition[] = this.getPositionsFromDelta(spawn.pos, roadDeltas);
    creationIdea.addBuilds(roadPositions, STRUCTURE_ROAD, 50, false, false, true);

    // Build roads to sources in the neighborhood
    for (const room of spawn.room.neighborhood) {
      const remoteSources = room.find(FIND_SOURCES);
      for (const source of remoteSources) {
        this.buildRoadToPosition(creationIdea, spawn.pos, source.pos, false);
      }
    }

    // Build road to controller
    const controller = spawn.room.controller;
    if (controller && controller.my) {
      this.buildRoadToPosition(creationIdea, spawn.pos, controller.pos, false);
    }

    // Build roads to all containers
    const containers = spawn.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    for (const container of containers) {
      this.buildRoadToPosition(creationIdea, spawn.pos, container.pos, false);
    }
  }

  private buildRoadToPosition(
    creationIdea: CreationIdea,
    originPos: RoomPosition,
    pos: RoomPosition,
    onlySwamp: boolean
  ): void {
    const pathFind = PathFindWithRoad(originPos, pos);
    let priority = pathFind.cost;
    for (const pathStep of pathFind.path) {
      if (onlySwamp && Game.map.getRoomTerrain(pathStep.roomName).get(pathStep.x, pathStep.y) !== TERRAIN_MASK_SWAMP) {
        continue;
      }
      creationIdea.addBuild(pathStep, STRUCTURE_ROAD, priority, false, false);
      priority++;
    }
  }
}
