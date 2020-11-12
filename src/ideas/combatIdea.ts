import { Idea, IdeaType } from "./idea";
import { Imagination } from "imagination";

export class CombatIdea extends Idea {
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea) {
    super(spawn, imagination, type, idea);
  }
}
