import { Idea, IdeaType } from "./idea";
import { CreationIdea } from "./creationIdea";
import { GenesisIdea } from "./genesisIdea";
import { Imagination } from "imagination";

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    super(spawn, imagination, type);

    // Initialize ideas
    this.imagination.ideas[this.name][IdeaType.GENESIS] = new GenesisIdea(spawn, imagination, IdeaType.GENESIS);
    this.imagination.ideas[this.name][IdeaType.CREATION] = new CreationIdea(spawn, imagination, IdeaType.CREATION);
  }
}
