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
      const rv = new RoomVisual(pos.roomName);
      const lookConstructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (lookConstructionSite.length) {
        rv.circle(pos.x, pos.y, { radius: 0.4, fill: "#00ff00" });
        continue;
      }
      const lookStructure = pos.lookFor(LOOK_STRUCTURES);
      if (lookStructure.length) {
        rv.circle(pos.x, pos.y, { radius: 0.4, fill: "#0000ff" });
        continue;
      }
      if (Game.map.getRoomTerrain(pos.roomName).get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
        rv.circle(pos.x, pos.y, { radius: 0.4, fill: "#ff0000" });
        continue;
      }
      // rv.circle(pos.x, pos.y, { radius: 0.4, fill: "#ff00ff" });
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
    if (positions.length) {
      result = true;
    }
    return result;
  }
}

profiler.registerClass(BuildThought, "BuildThought");
