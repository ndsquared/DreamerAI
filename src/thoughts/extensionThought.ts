import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const extensionDeltas: Coord[] = [];
    extensionDeltas.push({ x: 0, y: 0 });
    extensionDeltas.push({ x: 1, y: 1 });
    extensionDeltas.push({ x: 1, y: -1 });
    extensionDeltas.push({ x: -1, y: -1 });
    extensionDeltas.push({ x: -1, y: 1 });

    const roadDeltas: Coord[] = [];
    roadDeltas.push({ x: 1, y: 0 });
    roadDeltas.push({ x: -1, y: 0 });
    roadDeltas.push({ x: 0, y: 1 });
    roadDeltas.push({ x: 0, y: -1 });

    const allDeltas = extensionDeltas.concat(roadDeltas);
    const pivotPos = this.getNextPivotPos(this.idea.spawn.pos, allDeltas);

    if (pivotPos) {
      const extensionPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, extensionDeltas);
      const roadPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, roadDeltas);

      this.idea.addBuild(extensionPositions, STRUCTURE_EXTENSION, 2);
      this.idea.addBuild(roadPositions, STRUCTURE_ROAD, 50);
    }
  }
}
