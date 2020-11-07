/* eslint-disable @typescript-eslint/no-empty-function */
import { GetRoomPosition } from "utils/misc";
import { Idea } from "ideas/idea";
import { Thought } from "./thought";
import profiler from "screeps-profiler";

export enum BuildThoughtName {
  EXTENSION = "Extension",
  ROAD = "Road",
  CONTAINER = "Container",
  TOWER = "Tower",
  STORAGE = "Storage",
  RAMPART = "Rampart",
  LINK = "Link",
  TERMINAL = "Terminal"
}

export abstract class BuildThought extends Thought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
  }

  public abstract buildPlan(): void;

  public ponder(): void {
    if (Game.time % global.BUILD_PLAN_INTERVAL === 0) {
      this.buildPlan();
    }
  }
  public think(): void {}
  public reflect(): void {}

  public cardinalDirections(): Coord[] {
    const dirs: Coord[] = [];
    dirs.push({ x: 1, y: 0 });
    dirs.push({ x: -1, y: 0 });
    dirs.push({ x: 0, y: -1 });
    dirs.push({ x: 0, y: 1 });
    return dirs;
  }

  public ordinalDirections(): Coord[] {
    const dirs: Coord[] = [];
    dirs.push({ x: 1, y: 1 });
    dirs.push({ x: 1, y: -1 });
    dirs.push({ x: -1, y: -1 });
    dirs.push({ x: -1, y: 1 });
    return dirs;
  }

  public cardinalAndOrdinalDirections(): Coord[] {
    return this.cardinalDirections().concat(this.ordinalDirections());
  }

  public standardDeltas(): Coord[] {
    let deltas: Coord[] = [];
    deltas.push({ x: 0, y: 0 });
    deltas = deltas.concat(this.ordinalDirections());
    return deltas;
  }

  public getPositionsStandard(pivotPos: RoomPosition): RoomPosition[] {
    const deltas = this.standardDeltas();
    const positions = this.getPositionsFromDelta(pivotPos, deltas);
    return positions;
  }

  public getPositionsFromDelta(pivotPos: RoomPosition, deltas: Coord[]): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (const delta of deltas) {
      const pos = GetRoomPosition(pivotPos.x + delta.x, pivotPos.y + delta.y, pivotPos.roomName);
      if (!pos) {
        continue;
      }
      if (Game.map.getRoomTerrain(pos.roomName).get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
        continue;
      }
      positions.push(pos);
    }
    return positions;
  }

  public getNextPivotPosStandard(startPos: RoomPosition, deltaMod: number): RoomPosition | null {
    const deltas = this.standardDeltas();
    return this.getNextPivotPos(startPos, deltas, deltaMod);
  }

  public getNextPivotPos(startPos: RoomPosition, deltas: Coord[], deltaMod: number): RoomPosition | null {
    const visited: { [pos: string]: boolean } = {};
    const pivotQueue: RoomPosition[] = [startPos];
    visited[startPos.toString()] = true;
    const directions: Coord[] = this.cardinalAndOrdinalDirections();

    while (pivotQueue.length > 0) {
      const currentPos = pivotQueue.shift();
      for (const dir of directions) {
        if (!currentPos) {
          break;
        }
        const nextPos = GetRoomPosition(
          currentPos.x + deltaMod * dir.x,
          currentPos.y + deltaMod * dir.y,
          currentPos.roomName
        );
        if (nextPos && !visited[nextPos.toString()]) {
          pivotQueue.push(nextPos);
          visited[nextPos.toString()] = true;
        }
      }
      if (currentPos && !currentPos.isEqualTo(startPos) && this.canBuildAtPivotPos(currentPos, deltas)) {
        return currentPos;
      }
    }
    return null;
  }

  public canBuildAtPivotPos(pivotPos: RoomPosition, deltas: Coord[]): boolean {
    let result = false;
    const positions = this.getPositionsFromDelta(pivotPos, deltas);
    for (const lookPos of positions) {
      const rv = new RoomVisual(lookPos.roomName);
      const lookConstructionSite = lookPos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (lookConstructionSite.length) {
        rv.circle(lookPos.x, lookPos.y, { radius: 0.5, fill: "#00ffff" });
        continue;
      }
      const lookStructure = lookPos.lookFor(LOOK_STRUCTURES);
      if (lookStructure.length) {
        rv.circle(lookPos.x, lookPos.y, { radius: 0.5, fill: "#0000ff" });
        continue;
      }
      rv.circle(lookPos.x, lookPos.y, { radius: 0.5, fill: "#ff00ff" });
      result = true;
    }
    return result;
  }
}

profiler.registerClass(BuildThought, "BuildThought");
