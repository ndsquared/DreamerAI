import { HarvestThought } from "../thoughts/harvestThought";
import { Idea } from "./idea";
import { PickupThought } from "thoughts/pickupThought";
import { ThoughtName } from "../thoughts/thought";

export class TabulaRasaIdea extends Idea {
  public constructor(spawnId: Id<StructureSpawn>) {
    super(spawnId);
    this.thoughts[ThoughtName.HARVEST] = [new HarvestThought(this, ThoughtName.HARVEST, 0)];
    this.thoughts[ThoughtName.PICKUP] = [new PickupThought(this, ThoughtName.PICKUP, 0)];
  }
}
