import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "../thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class TerminalThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (room.terminal) {
      return;
    }
    const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
    const pivotPos = this.getNextPivotPosStandard(baseOriginPos, 3);

    if (pivotPos) {
      const terminalPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      creationIdea.addBuilds(terminalPositions, STRUCTURE_TERMINAL, 2, true, false);
    }
  }
}
