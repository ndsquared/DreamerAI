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
  public constructor(idea: Idea, name: string, instance: number) {
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
}
