import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class RoadThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    // Build roads to all the sources in the room
    const sources = Game.rooms[spawn.pos.roomName].find(FIND_SOURCES);

    for (const source of sources) {
      const pathFind = PathFinder.search(spawn.pos, { pos: source.pos, range: 1 });
      this.idea.addBuild(pathFind.path, STRUCTURE_ROAD, pathFind.cost);
    }

    // Build road to controller
    const controller = spawn.room.controller;
    if (controller && controller.my) {
      const pathFind = PathFinder.search(spawn.pos, { pos: controller.pos, range: 2 });
      this.idea.addBuild(pathFind.path, STRUCTURE_ROAD, pathFind.cost);
    }
  }
}
