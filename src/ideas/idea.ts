import { Thought } from "thoughts/thought";

export abstract class Idea implements IBrain {
  public thoughts: { [name: string]: Thought[] } = {};
  private spawnId: Id<StructureSpawn>;
  private spawnQueue: SpawnQueuePayload[] = [];

  constructor(spawnId: Id<StructureSpawn>) {
    this.spawnId = spawnId;
  }

  get spawn() {
    return Game.getObjectById(this.spawnId);
  }

  ponder() {
    for (const thoughtName in this.thoughts) {
      for (let thought of this.thoughts[thoughtName]) {
        thought.ponder();
      }
    }
  }

  think() {
    this.processSpawnQueue();
    for (const thoughtName in this.thoughts) {
      for (let thought of this.thoughts[thoughtName]) {
        thought.think();
      }
    }
  }

  reflect() {
    for (const thoughtName in this.thoughts) {
      for (let thought of this.thoughts[thoughtName]) {
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
            interneurons: [],
            ideaName: this.spawn.room.name,
            thoughtName: nextSpawn.thoughtName,
            thoughtInstance: nextSpawn.thoughtInstance
          };
          this.spawn.spawnCreep(nextSpawn.body, nextSpawn.name, { memory: memory });
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
  ) {
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
