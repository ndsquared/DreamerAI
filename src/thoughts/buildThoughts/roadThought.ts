import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class RoadThought extends BuildThought {
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
    // Build roads around spawns
    const spawnPositions = _.map(this.idea.baseRoomObjects.spawns, s => s.pos);
    for (const spawnPos of spawnPositions) {
      const roadDeltas: Coord[] = this.cardinalDirections();
      const roadPositions: RoomPosition[] = this.getPositionsFromDelta(spawnPos, roadDeltas);
      creationIdea.addBuilds(roadPositions, STRUCTURE_ROAD, 50, false, false, false);
    }

    // Build roads to all containers
    for (const containers of Object.values(this.idea.neighborhood.sourceContainers)) {
      for (const container of containers) {
        this.buildRoadToPosition(creationIdea, baseOriginPos, container.pos, false);
      }
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
      if (pathStep.isEdge) {
        continue;
      }
      creationIdea.addBuild(pathStep, STRUCTURE_ROAD, priority, false, false);
      priority++;
    }
  }
}
