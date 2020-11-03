/* eslint-disable @typescript-eslint/no-empty-function */
import { Idea } from "ideas/idea";
import { Thought } from "./thought";

export enum BuildThoughtName {
  EXTENSION = "Extension",
  ROAD = "Road",
  CONTAINER = "Container",
  TOWER = "Tower",
  STORAGE = "Storage"
}

export abstract class BuildThought extends Thought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public ponder(): void {}
  public think(): void {}
  public reflect(): void {}

  public getPositionsFromDelta(pivotPos: RoomPosition, deltas: Coord[]): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (const delta of deltas) {
      const pos = new RoomPosition(pivotPos.x + delta.x, pivotPos.y + delta.y, pivotPos.roomName);
      positions.push(pos);
    }
    return positions;
  }

  public getNextPivotPos(startPos: RoomPosition, deltas: Coord[]): RoomPosition | null {
    // const rv = new RoomVisual(startPos.roomName);
    // rv.circle(startPos.x, startPos.y, { fill: "#ff0000" });
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
    let pivotOpts = 0;
    while (pivotOpts < 100) {
      for (const dir of directions) {
        // TODO: Need to check that the pivotPos is in bounds
        const pivotPos = new RoomPosition(startPos.x + xMod * dir.x, startPos.y + yMod * dir.y, startPos.roomName);
        // rv.circle(pivotPos.x, pivotPos.y, { fill: "#ff00ff" });
        // console.log(`(${pivotPos.x}, ${pivotPos.y})`);
        if (this.canBuildAtPivotPos(pivotPos, deltas)) {
          return pivotPos;
        }
        pivotOpts++;
      }
      xMod += 3;
      yMod += 3;
    }
    return null;
  }

  public canBuildAtPivotPos(pivotPos: RoomPosition, deltas: Coord[]): boolean {
    let result = false;
    const positions = this.getPositionsFromDelta(pivotPos, deltas);
    for (const lookPos of positions) {
      // const rv = new RoomVisual(lookPos.roomName);
      const lookConstructionSite = lookPos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (lookConstructionSite.length) {
        // console.log(`Found construction site at (${lookPos.x}, ${lookPos.y})`);
        // rv.circle(lookPos.x, lookPos.y, { fill: "#00ff00" });
        continue;
      }
      const lookStructure = lookPos.lookFor(LOOK_STRUCTURES);
      if (lookStructure.length) {
        // console.log(`Found structure at (${lookPos.x}, ${lookPos.y})`);
        // rv.circle(lookPos.x, lookPos.y, { fill: "#00ff00" });
        continue;
      }
      const lookTerrain = lookPos.lookFor(LOOK_TERRAIN);
      if (lookTerrain.length && lookTerrain[0] === "wall") {
        // console.log(`Found wall at (${lookPos.x}, ${lookPos.y})`);
        // rv.circle(lookPos.x, lookPos.y, { fill: "#00ff00" });
        continue;
      }
      // rv.circle(lookPos.x, lookPos.y, { fill: "#0000ff" });
      result = true;
    }
    // console.log(result);
    return result;
  }
}
