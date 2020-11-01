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
}
