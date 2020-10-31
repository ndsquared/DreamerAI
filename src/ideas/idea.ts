import { Thought } from "thoughts/thought";

export abstract class Idea implements IBrain {
  public thoughts: { [name: string]: Thought[] } = {};
  private spawnId: Id<StructureSpawn>;
  private spawnQueue: SpawnQueuePayload[] = [];

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
    this.spawnQueue = [];
  }

  private processSpawnQueue() {
    if (!this.spawn) {
      return;
    }
    if (this.spawnQueue.length > 0) {
      const spawnCheck = this.spawnQueue[0];
      const status = this.spawn.spawnCreep(spawnCheck.body, spawnCheck.name, { dryRun: true });
      if (status === OK) {
        const nextSpawn = this.spawnQueue.shift();
        if (nextSpawn) {
          const memory = {
            _trav: {},
            interneurons: [],
            ideaName: this.spawn.room.name,
            thoughtName: nextSpawn.thoughtName,
            thoughtInstance: nextSpawn.thoughtInstance
          };
          this.spawn.spawnCreep(nextSpawn.body, nextSpawn.name, { memory });
        }
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
    this.spawnQueue.push(spawnPayload);
  }
}
