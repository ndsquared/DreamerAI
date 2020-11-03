import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";
import { PathFindWithRoad } from "utils/misc";

export class RoadThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    // Build roads to sources in the neighborhood
    for (const room of spawn.room.neighborhood) {
      const remoteSources = room.find(FIND_SOURCES);
      this.buildRoadToSources(spawn.pos, remoteSources);
    }

    // Build road to controller
    const controller = spawn.room.controller;
    if (controller && controller.my) {
      const pathFind = PathFindWithRoad(spawn.pos, controller.pos);
      this.idea.addBuild(pathFind.path, STRUCTURE_ROAD, pathFind.cost);
    }

    // Build roads to all containers
    const containers = spawn.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    for (const container of containers) {
      const pathFind = PathFindWithRoad(spawn.pos, container.pos);
      this.idea.addBuild(pathFind.path, STRUCTURE_ROAD, pathFind.cost);
    }
  }

  private buildRoadToSources(originPos: RoomPosition, sources: Source[]): void {
    for (const source of sources) {
      const pathFind = PathFindWithRoad(originPos, source.pos);
      // if (pathFind.incomplete) {
      //   console.log(`path to ${source.id} was incomplete`);
      // }
      // console.log(`path cost to ${source.id} is ${pathFind.cost}`);
      // console.log(`path ops to ${source.id} is ${pathFind.ops}`);
      // console.log(pathFind.path.toString());
      this.idea.addBuild(pathFind.path, STRUCTURE_ROAD, pathFind.cost);
    }
  }
}
