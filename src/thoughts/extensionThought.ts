import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    super.ponder();
    if (!this.shouldBuild) {
      return;
    }
    const spawn = this.idea.spawn;
    if (!spawn) {
      return;
    } else if (spawn.room.controller && spawn.room.controller.my && spawn.room.controller?.level < 2) {
      return;
    }

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

    let pivotPos = spawn.pos;
    pivotPos = new RoomPosition(pivotPos.x - 3, pivotPos.y, pivotPos.roomName);

    const extensionPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, extensionDeltas);
    const roadPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, roadDeltas);

    this.addBuild(extensionPositions, STRUCTURE_EXTENSION, 10);
    this.addBuild(roadPositions, STRUCTURE_ROAD, 1);
  }
}
