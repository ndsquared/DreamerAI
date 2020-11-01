import { FigmentThoughtName } from "thoughts/figmentThought";
import { HarvestThought } from "../thoughts/harvestThought";
import { Idea } from "./idea";
import { PickupThought } from "thoughts/pickupThought";
import { WorkerThought } from "thoughts/workerThought";

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn) {
    super(spawn);
    const sources = _.sortBy(
      Game.rooms[spawn.pos.roomName].find(FIND_SOURCES, { filter: s => !s.pos.hasAdjacentKeeper }),
      s => s.pos.findPathTo(spawn.pos).length
    );
    this.figmentThoughts[FigmentThoughtName.HARVEST] = [];
    for (let index = 0; index < sources.length; index++) {
      const source = sources[index];
      this.figmentThoughts[FigmentThoughtName.HARVEST].push(
        new HarvestThought(this, FigmentThoughtName.HARVEST, index, source)
      );
    }
    this.figmentThoughts[FigmentThoughtName.PICKUP] = [new PickupThought(this, FigmentThoughtName.PICKUP, 0)];
    this.figmentThoughts[FigmentThoughtName.WORKER] = [new WorkerThought(this, FigmentThoughtName.WORKER, 0)];
  }
}
