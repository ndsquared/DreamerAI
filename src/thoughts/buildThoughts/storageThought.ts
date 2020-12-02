import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class StorageThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    const storageCount = this.idea.baseRoomObjects.storage ? 1 : 0;
    const rclStorageThreshold = CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][this.idea.rcl];
    if (storageCount >= rclStorageThreshold) {
      return;
    }
    const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
    const pivotPos = this.getNextPivotPosStandard(baseOriginPos, 3);

    if (pivotPos) {
      const storagePositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(storagePositions, STRUCTURE_STORAGE, 1, true, false);
    }
  }
}
