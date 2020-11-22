import { BuildThought } from "./buildThought";
import { BuildThoughtType } from "./thought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, type: BuildThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    const baseOriginPos = this.idea.hippocampus.getBaseOriginPos(room.name);
    if (this.idea.hippocampus.extensions.length >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][this.idea.rcl]) {
      // console.log("At max extensions for RCL");
      return;
    }
    const extensionDeltas: Coord[] = this.standardDeltas();
    const roadDeltas: Coord[] = this.cardinalDirections();

    const allDeltas = extensionDeltas.concat(roadDeltas);
    const pivotPos = this.getNextPivotPos(baseOriginPos, allDeltas, 3);

    if (pivotPos) {
      const extensionPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      const roadPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, roadDeltas);

      creationIdea.addBuilds(extensionPositions, STRUCTURE_EXTENSION, 2, false, false);
      creationIdea.addBuilds(roadPositions, STRUCTURE_ROAD, 50, false, false);
    }
  }
}
