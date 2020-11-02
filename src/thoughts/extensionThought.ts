import { BuildThought } from "./buildThought";
import { Idea } from "ideas/idea";

export class ExtensionThought extends BuildThought {
  public constructor(idea: Idea, name: string, instance: number) {
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

    const extensionPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, extensionDeltas);
    const roadPositions: RoomPosition[] = this.getPositionsFromDelta(pivotPos, roadDeltas);

    this.idea.addBuild(extensionPositions, STRUCTURE_EXTENSION, 1);
    this.idea.addBuild(roadPositions, STRUCTURE_ROAD, 10);
  }

  public getNextPivotPos(startPos: RoomPosition, deltas: Coord[]): RoomPosition {
    let pivotPos = new RoomPosition(startPos.x - 3, startPos.y, startPos.roomName);
    const directions: Coord[] = [];
    directions.push({ x: -1, y: 0 });
    directions.push({ x: -1, y: -1 });
    directions.push({ x: 0, y: -1 });
    directions.push({ x: 1, y: -1 });
    directions.push({ x: 1, y: 0 });
    directions.push({ x: 1, y: 1 });
    directions.push({ x: 0, y: 1 });
    directions.push({ x: -1, y: 1 });
    let xMod = 3;
    let yMod = 3;
    while (!this.canBuildAtPivotPos(pivotPos, deltas)) {
      for (const dir of directions) {
        pivotPos = new RoomPosition(startPos.x + xMod * dir.x, startPos.y + yMod * dir.y, startPos.roomName);
      }
      xMod += 3;
      yMod += 3;
    }
    return pivotPos;
  }

  public canBuildAtPivotPos(pivotPos: RoomPosition, deltas: Coord[]): boolean {
    let result = false;
    const positions = this.getPositionsFromDelta(pivotPos, deltas);
    for (const lookPos of positions) {
      const lookConstructionSite = lookPos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (lookConstructionSite.length) {
        // console.log(`Found construction site at (${lookPos.x}, ${lookPos.y})`);
        continue;
      }
      const lookStructure = lookPos.lookFor(LOOK_STRUCTURES);
      if (lookStructure.length) {
        // console.log(`Found structure at (${lookPos.x}, ${lookPos.y})`);
        continue;
      }
      const lookTerrain = lookPos.lookFor(LOOK_TERRAIN);
      if (lookTerrain.length && lookTerrain[0] === "wall") {
        // console.log(`Found wall at (${lookPos.x}, ${lookPos.y})`);
        continue;
      }
      result = true;
    }
    return result;
  }
}
