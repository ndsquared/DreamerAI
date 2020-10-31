import { Idea } from "./idea";
import { HarvestThought } from "thoughts/harvestThought";
import { ThoughtName } from "thoughts/thought";

export class TabulaRasaIdea extends Idea {
  constructor(spawnId: Id<StructureSpawn>) {
    super(spawnId);
    this.thoughts[ThoughtName.HARVEST] = [new HarvestThought(this, ThoughtName.HARVEST, 0)];
  }
}
