import { FigmentThought, FigmentThoughtName } from "thoughts/figmentThought";
import { BuildThought } from "thoughts/buildThought";
import PriorityQueue from "ts-priority-queue";

export abstract class Idea implements IBrain {
  public figmentThoughts: { [name: string]: FigmentThought[] } = {};
  public buildThoughts: { [name: string]: BuildThought[] } = {};
  public spawn: StructureSpawn;
  private spawnQueue: PriorityQueue<SpawnQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });
  private buildQueue: PriorityQueue<BuildQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Lower priority is dequeued first
      return a.priority - b.priority;
    }
  });
  public shouldBuild = true;
  public rcl = 0;
  public constructor(spawn: StructureSpawn) {
    this.spawn = spawn;
    // Initialize memory
    if (!Memory.imagination.ideas[spawn.room.name]) {
      Memory.imagination.ideas[spawn.room.name] = {
        figmentCount: {}
      };
    }
  }

  public ponder(): void {
    this.spawn = Game.spawns[this.spawn.name];
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thought of thoughts[thoughtName]) {
        thought.ponder();
      }
    }
    this.rcl = this.spawn.room.controller?.level === undefined ? 0 : this.spawn.room.controller.level;

    if (this.spawn.room.controller && this.spawn.room.controller.my && this.rcl < 2) {
      return;
    } else {
      const constructionSites = this.spawn.room.find(FIND_MY_CONSTRUCTION_SITES);
      if (constructionSites.length > 0) {
        this.shouldBuild = false;
      }
    }
    if (!this.shouldBuild) {
      return;
    }
  }

  public think(): void {
    this.processSpawnQueue();
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thought of thoughts[thoughtName]) {
        thought.think();
      }
    }
  }

  public reflect(): void {
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thought of thoughts[thoughtName]) {
        thought.reflect();
      }
    }
    this.spawnQueue.clear();
    this.buildQueue.clear();
    this.shouldBuild = true;
  }

  private processSpawnQueue() {
    if (!this.spawn) {
      return;
    }
    if (this.spawnQueue.length > 0) {
      const nextSpawn = this.spawnQueue.dequeue();
      const status = this.spawn.spawnCreep(nextSpawn.body, nextSpawn.name, { dryRun: true });
      if (status === OK) {
        const memory = {
          _trav: {},
          interneurons: [],
          ideaName: this.spawn.room.name,
          thoughtName: nextSpawn.thoughtName,
          thoughtInstance: nextSpawn.thoughtInstance
        };
        this.spawn.spawnCreep(nextSpawn.body, nextSpawn.name, { memory });
        console.log(`spawning ${nextSpawn.name} with priority ${nextSpawn.priority}`);
        this.adjustFigmentCount(nextSpawn.thoughtName, 1);
      }
    }
  }

  public addSpawn(
    name: string,
    body: BodyPartConstant[],
    priority: number,
    thoughtName: string,
    thoughtInstance: number
  ): void {
    const spawnPayload = {
      name,
      body,
      priority,
      thoughtName,
      thoughtInstance
    };
    this.spawnQueue.queue(spawnPayload);
  }

  public getFigmentCount(figmentThoughtName: FigmentThoughtName): number {
    const count = Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName];
    if (count) {
      return count;
    }
    return 0;
  }

  public adjustFigmentCount(figmentThoughtName: FigmentThoughtName | string, delta: number): void {
    console.log(`adjust figment count ${figmentThoughtName} by ${delta}`);
    const count = Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName];
    if (count) {
      Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName] += delta;
    } else {
      Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName] = delta;
    }
  }

  private processBuildQueue(): void {
    if (!this.shouldBuild) {
      return;
    }
    while (this.buildQueue.length > 0) {
      const nextBuild = this.buildQueue.dequeue();
      const buildResult = this.spawn.room.createConstructionSite(nextBuild.pos, nextBuild.structure);
      if (buildResult === OK) {
        console.log(`Building ${nextBuild.structure} at (${nextBuild.pos.x}, ${nextBuild.pos.y})`);
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
}
