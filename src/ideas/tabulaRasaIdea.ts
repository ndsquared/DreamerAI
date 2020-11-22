import { Idea, IdeaType } from "./idea";
import { CreationIdea } from "./creationIdea";
import { GenesisIdea } from "./genesisIdea";
import { Imagination } from "imagination";

// TODO: Is this class even useful anymore?
export class TabulaRasaIdea extends Idea {
  public constructor(roomName: string, imagination: Imagination, type: IdeaType) {
    super(roomName, imagination, type);

    // Initialize ideas
    this.imagination.ideas[this.roomName][IdeaType.GENESIS] = new GenesisIdea(roomName, imagination, IdeaType.GENESIS);
    this.imagination.ideas[this.roomName][IdeaType.CREATION] = new CreationIdea(
      roomName,
      imagination,
      IdeaType.CREATION
    );
  }
}
