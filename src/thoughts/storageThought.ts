import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class StorageThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(): void {
    const pivotPos = this.getNextPivotPosStandard(this.idea.spawn.pos, 3);

    if (pivotPos) {
      const storagePositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      this.idea.addBuilds(storagePositions, STRUCTURE_STORAGE, 2);
    }
  }
}
