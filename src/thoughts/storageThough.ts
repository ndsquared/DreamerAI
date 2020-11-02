import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class StorageThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const storageDeltas: Coord[] = [];
    storageDeltas.push({ x: 0, y: 0 });
    storageDeltas.push({ x: 1, y: 1 });
    storageDeltas.push({ x: 1, y: -1 });
    storageDeltas.push({ x: -1, y: -1 });
    storageDeltas.push({ x: -1, y: 1 });

    const pivotPos = this.getNextPivotPos(this.idea.spawn.pos, storageDeltas);

    if (pivotPos) {
      const storagePositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, storageDeltas);
      this.idea.addBuild(storagePositions, STRUCTURE_STORAGE, 2);
    }
  }
}
