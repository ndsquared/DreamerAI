import { Idea } from "ideas/idea";
import PriorityQueue from "ts-priority-queue";
import { Thought } from "./thought";

export enum BuildThoughtName {
  EXTENSION = "Extension",
  ROAD = "Road",
  CONTAINER = "Container",
  TOWER = "Tower",
  STORAGE = "Storage"
}

export abstract class BuildThought extends Thought {
  private buildQueue: PriorityQueue<BuildQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  protected shouldBuild = true;
  protected rcl = 0;
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public ponder(): void {
    const spawn = this.idea.spawn;
    if (!spawn) {
      return;
    }
    this.rcl = spawn.room.controller?.level === undefined ? 0 : spawn.room.controller.level;

    if (spawn.room.controller && spawn.room.controller.my && this.rcl < 2) {
      return;
    } else {
      const constructionSites = spawn.room.find(FIND_MY_CONSTRUCTION_SITES);
      if (constructionSites.length > 0) {
        this.shouldBuild = false;
      }
    }
    if (!this.shouldBuild) {
      return;
    }
    this.planBuild();
  }

  public abstract planBuild(): void;

  public think(): void {
    if (!this.shouldBuild) {
      return;
    }
    this.processBuildQueue();
  }
  public reflect(): void {
    this.buildQueue.clear();
    this.shouldBuild = true;
  }

  private processBuildQueue(): void {
    if (!this.idea.spawn) {
      return;
    }
    while (this.buildQueue.length > 0) {
      const nextBuild = this.buildQueue.dequeue();
      console.log(`Building ${nextBuild.structure} at (${nextBuild.pos.x}, ${nextBuild.pos.y})`);
      const buildResult = this.idea.spawn.room.createConstructionSite(nextBuild.pos, nextBuild.structure);
      if (buildResult === OK) {
        break;
      }
    }
  }

  public addBuild(positions: RoomPosition[], structure: StructureConstant, priority: number): void {
    for (const pos of positions) {
      const buildPayload = {
        pos,
        structure,
        priority
      };
      this.buildQueue.queue(buildPayload);
    }
  }

  public getPositionsFromDelta(pivotPos: RoomPosition, deltas: Coord[]): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (const delta of deltas) {
      const pos = new RoomPosition(pivotPos.x + delta.x, pivotPos.y + delta.y, pivotPos.roomName);
      positions.push(pos);
    }
    return positions;
  }
}
