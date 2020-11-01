import { FigmentThoughtName } from "thoughts/figmentThought";
import { HarvestThought } from "../thoughts/harvestThought";
import { Idea } from "./idea";
import { PickupThought } from "thoughts/pickupThought";
import { WorkerThought } from "thoughts/workerThought";

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn) {
    super(spawn);
    this.figmentThoughts[FigmentThoughtName.HARVEST] = [new HarvestThought(this, FigmentThoughtName.HARVEST, 0)];
    this.figmentThoughts[FigmentThoughtName.PICKUP] = [new PickupThought(this, FigmentThoughtName.PICKUP, 0)];
    this.figmentThoughts[FigmentThoughtName.WORKER] = [new WorkerThought(this, FigmentThoughtName.WORKER, 0)];
  }
}
