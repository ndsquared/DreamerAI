import { BuildThought } from "./buildThought";
import { CreationIdea } from "ideas/creationIdea";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(creationIdea: CreationIdea): void {
    if (this.idea.hippocampus.extensions.length >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][this.idea.rcl]) {
      // console.log("At max extensions for RCL");
      return;
    }
    const extensionDeltas: Coord[] = this.standardDeltas();
    const roadDeltas: Coord[] = this.cardinalDirections();

    const allDeltas = extensionDeltas.concat(roadDeltas);
    const pivotPos = this.getNextPivotPos(this.idea.spawn.pos, allDeltas, 3);

    if (pivotPos) {
      const extensionPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      const roadPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, roadDeltas);

      creationIdea.addBuilds(extensionPositions, STRUCTURE_EXTENSION, 2, false, false);
      creationIdea.addBuilds(roadPositions, STRUCTURE_ROAD, 50, false, false);
    }
  }
}
