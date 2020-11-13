import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class StorageThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.spawn.room.storage) {
      return;
    }
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);

    if (pivotPos) {
      const storagePositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(storagePositions, STRUCTURE_STORAGE, 2, true, false);
    }
  }
}
