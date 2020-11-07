import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public buildPlan(): void {
    const extensionDeltas: Coord[] = this.standardDeltas();
    const roadDeltas: Coord[] = [];
    roadDeltas.push({ x: 1, y: 0 });
    roadDeltas.push({ x: -1, y: 0 });
    roadDeltas.push({ x: 0, y: 1 });
    roadDeltas.push({ x: 0, y: -1 });

    const allDeltas = extensionDeltas.concat(roadDeltas);
    const pivotPos = this.getNextPivotPos(this.idea.spawn.pos, allDeltas, 3);

    if (pivotPos) {
      const extensionPositions: RoomPosition[] = this.getPositionsStandard(pivotPos);
      const roadPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, roadDeltas);

      this.idea.addBuilds(extensionPositions, STRUCTURE_EXTENSION, 2);
      this.idea.addBuilds(roadPositions, STRUCTURE_ROAD, 50);
    }
  }
}
