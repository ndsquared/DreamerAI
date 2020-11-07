import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class RoadThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(): void {
    const spawn = this.idea.spawn;
    // Build roads to sources in the neighborhood
    for (const room of spawn.room.neighborhood) {
      const remoteSources = room.find(FIND_SOURCES);
      for (const source of remoteSources) {
        this.buildRoadToPosition(spawn.pos, source.pos);
      }
    }

    // Build road to controller
    const controller = spawn.room.controller;
    if (controller && controller.my) {
      this.buildRoadToPosition(spawn.pos, controller.pos);
    }

    // Build roads to all containers
    const containers = spawn.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    for (const container of containers) {
      this.buildRoadToPosition(spawn.pos, container.pos);
    }
  }

  private buildRoadToPosition(originPos: RoomPosition, pos: RoomPosition): void {
    // const rv = new RoomVisual(originPos.roomName);
    // rv.line(originPos, pos, { lineStyle: "dotted" });
    const pathFind = PathFindWithRoad(originPos, pos);
    let priority = pathFind.cost;
    for (const pathStep of pathFind.path) {
      this.idea.addBuild(pathStep, STRUCTURE_ROAD, priority);
      priority++;
    }
  }
}
