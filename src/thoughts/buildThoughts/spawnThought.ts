import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class SpawnThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (this.idea.baseRoomObjects.spawns.length >= CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][this.idea.rcl]) {
      return;
    }
    const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
    const pivotPos = this.getNextPivotPosStandard(baseOriginPos, 3);

    if (pivotPos) {
      const spawnPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(spawnPositions, STRUCTURE_SPAWN, 1, true, false, true);
    }
  }
}
