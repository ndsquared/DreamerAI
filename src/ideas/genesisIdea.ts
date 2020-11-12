import { FigmentThought, FigmentType } from "thoughts/figmentThought";
import { Idea, IdeaType } from "./idea";
import { Figment } from "figments/figment";
import { GetFigmentSpec } from "figments/figmentSpec";
import { Imagination } from "imagination";
import PriorityQueue from "ts-priority-queue";

export class GenesisIdea extends Idea {
  private spawnQueue: PriorityQueue<SpawnQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });
  private queuePriorities: { [type: string]: number } = {};
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea) {
    super(spawn, imagination, type, idea);
  }

  public ponder(): void {
    this.imagination.addStatus(`Spawn Queue: ${this.spawnQueue.length}`);
    if (this.spawnQueue.length === 0) {
      this.setQueuePriorities();
      if (this.idea) {
        for (const thoughtName in this.idea.thoughts) {
          for (const thoughtInstance in this.thoughts[thoughtName]) {
            const thought = this.thoughts[thoughtName][thoughtInstance];
            if (thought instanceof FigmentThought) {
              this.processThought(thought);
            }
          }
        }
      }
    }
  }

  public think(): void {
    this.processSpawnQueue();
  }

  private inEmergency(): boolean {
    const figments = this.spawn.room.find(FIND_MY_CREEPS);
    if (figments.length < 3) {
      return true;
    }
    return false;
  }

  private setQueuePriorities(): void {
    for (const figmentType in FigmentType) {
      switch (figmentType) {
        case FigmentType.HARVEST:
          this.queuePriorities[figmentType] = 12;
          if (this.getFigmentCount(FigmentType.HARVEST) > 1) {
            this.queuePriorities[FigmentType.HARVEST] = 5;
          }
          break;
        case FigmentType.TRANSFER:
          this.queuePriorities[figmentType] = 11;
          break;
        case FigmentType.PICKUP:
          this.queuePriorities[figmentType] = 10;
          break;
        case FigmentType.UPGRADE:
          this.queuePriorities[figmentType] = 8;
          break;
        case FigmentType.WORKER:
          this.queuePriorities[figmentType] = 7;
          break;
        case FigmentType.DEFENSE:
          this.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.ATTACK:
          this.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.RESERVE:
          this.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.SCOUT:
          this.queuePriorities[figmentType] = 1;
          break;
      }
    }
  }

  private processThought(thought: FigmentThought): void {
    for (const figmentType in thought.figments) {
      if (thought.figmentNeeded(figmentType as FigmentType)) {
        const payload = {
          name: Figment.GetUniqueName(),
          figmentSpec: GetFigmentSpec(figmentType as FigmentType),
          priority: this.queuePriorities[figmentType],
          thoughtName: thought.name,
          thoughtInstance: thought.instance
        };
        this.addSpawn(payload);
      }
    }
  }

  private processSpawnQueue() {
    if (this.spawn.spawning) {
      return;
    }
    let statusSpawn: SpawnQueuePayload | null = null;
    if (this.spawnQueue.length > 0) {
      const nextSpawn = this.spawnQueue.peek();
      statusSpawn = nextSpawn;
      // Set minimum energy to use for the next figment spawn
      let energyAvailable = this.spawn.room.energyCapacityAvailable;
      if (this.inEmergency() || nextSpawn.thoughtName === FigmentType.TRANSFER) {
        energyAvailable = this.spawn.room.energyAvailable;
      }
      // Calculate the body and check if we can spawn
      const body = Figment.GetBodyFromBodySpec(nextSpawn.figmentSpec.bodySpec, energyAvailable);
      const status = this.spawn.spawnCreep(body, nextSpawn.name, { dryRun: true });

      if (status === OK && body.length >= nextSpawn.figmentSpec.bodySpec.minParts) {
        const memory = {
          _trav: {},
          interneurons: [],
          ideaName: this.spawn.room.name,
          thoughtType: nextSpawn.thoughtName,
          thoughtInstance: nextSpawn.thoughtInstance,
          underAttack: false,
          underAttackCooldown: 5,
          combatReady: nextSpawn.figmentSpec.combatReady,
          inCombat: false,
          spawnRoomName: this.spawn.room.name
        };
        this.spawn.spawnCreep(body, nextSpawn.name, { memory });
        statusSpawn = null;
        this.spawnQueue.dequeue();
        this.imagination.addStatus(
          `Spawning ${nextSpawn.thoughtName}:${nextSpawn.thoughtInstance} priority ${nextSpawn.priority}`
        );
        this.adjustFigmentCount(nextSpawn.thoughtName, 1);
      }
    }
    if (statusSpawn) {
      this.imagination.addStatus(`Next Spawn: ${statusSpawn.thoughtName} with priority ${statusSpawn.priority}`);
    }
  }

  public addSpawn(payload: SpawnQueuePayload): void {
    this.spawnQueue.queue(payload);
  }

  public getFigmentCount(figmentType: FigmentType): number {
    const count = Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentType];
    if (count) {
      return count;
    }
    return 0;
  }

  public adjustFigmentCount(figmentType: FigmentType | string, delta: number): void {
    const count = Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentType];
    if (count) {
      Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentType] += delta;
    } else {
      Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentType] = delta;
    }
  }
}
