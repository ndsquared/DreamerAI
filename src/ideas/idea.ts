import PriorityQueue from "ts-priority-queue";
import { Thought } from "thoughts/thought";

export abstract class Idea implements IBrain {
  public thoughts: { [name: string]: Thought[] } = {};
  private spawnId: Id<StructureSpawn>;
  private spawnQueue: PriorityQueue<SpawnQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });

  public constructor(spawnId: Id<StructureSpawn>) {
    this.spawnId = spawnId;
  }

  public get spawn(): StructureSpawn | null {
    return Game.getObjectById(this.spawnId);
  }

  public ponder(): void {
    for (const thoughtName in this.thoughts) {
      for (const thought of this.thoughts[thoughtName]) {
        thought.ponder();
      }
    }
  }

  public think(): void {
    this.processSpawnQueue();
    for (const thoughtName in this.thoughts) {
      for (const thought of this.thoughts[thoughtName]) {
        thought.think();
      }
    }
  }

  public reflect(): void {
    for (const thoughtName in this.thoughts) {
      for (const thought of this.thoughts[thoughtName]) {
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
}
