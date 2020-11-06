import { FigmentThought, FigmentThoughtName } from "thoughts/figmentThought";
import { BuildThought } from "thoughts/buildThought";
import { Figment } from "figment";
import PriorityQueue from "ts-priority-queue";

export abstract class Idea implements IBrain {
  public figmentThoughts: { [name: string]: { [instance: string]: FigmentThought } } = {};
  public buildThoughts: { [name: string]: { [instance: string]: BuildThought } } = {};
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
  public shouldBuild: { [roomName: string]: boolean };
  public rcl = 0;
  public constructor(spawn: StructureSpawn) {
    this.spawn = spawn;
    // Initialize memory
    if (!Memory.imagination.ideas[spawn.room.name]) {
      Memory.imagination.ideas[spawn.room.name] = {
        figmentCount: {}
      };
    }
    this.shouldBuild = {};
  }

  public ponder(): void {
    this.spawn = Game.spawns[this.spawn.name];
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thoughtInstance in thoughts[thoughtName]) {
        const thought = thoughts[thoughtName][thoughtInstance];
        thought.ponder();
      }
    }
    this.rcl = this.spawn.room.controller?.level === undefined ? 0 : this.spawn.room.controller.level;

    if (this.rcl > 1) {
      for (const room of this.spawn.room.neighborhood) {
        this.shouldBuild[room.name] = true;
        const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
          this.shouldBuild[room.name] = false;
        }
      }
    }
  }

  public think(): void {
    this.processSpawnQueue();
    this.processBuildQueue();
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thoughtInstance in thoughts[thoughtName]) {
        const thought = thoughts[thoughtName][thoughtInstance];
        thought.think();
      }
    }
  }

  public reflect(): void {
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thoughtInstance in thoughts[thoughtName]) {
        const thought = thoughts[thoughtName][thoughtInstance];
        thought.reflect();
      }
    }
    this.spawnQueue.clear();
    this.buildQueue.clear();
  }

  private processSpawnQueue() {
    if (this.spawnQueue.length > 0) {
      const nextSpawn = this.spawnQueue.dequeue();
      const body = Figment.GetBodyFromBodySpec(nextSpawn.bodySpec, this.spawn.room.energyAvailable);
      const status = this.spawn.spawnCreep(body, nextSpawn.name, { dryRun: true });
      if (status === OK && body.length >= nextSpawn.bodySpec.minParts) {
        const memory = {
          _trav: {},
          interneurons: [],
          ideaName: this.spawn.room.name,
          thoughtName: nextSpawn.thoughtName,
          thoughtInstance: nextSpawn.thoughtInstance,
          underAttack: false,
          underAttackCooldown: 5
        };
        this.spawn.spawnCreep(body, nextSpawn.name, { memory });
        console.log(`Spawning ${nextSpawn.name}[${nextSpawn.thoughtName}] with priority ${nextSpawn.priority}`);
        this.adjustFigmentCount(nextSpawn.thoughtName, 1);
      }
    }
  }

  public addSpawn(
    name: string,
    bodySpec: FigmentBodySpec,
    priority: number,
    thoughtName: string,
    thoughtInstance: string
  ): void {
    const spawnPayload = {
      name,
      bodySpec,
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
    // console.log(`adjust figment count ${figmentThoughtName} by ${delta}`);
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
      const room = Game.rooms[nextBuild.pos.roomName];
      if (!room || !this.shouldBuild[room.name]) {
        continue;
      }
      const buildResult = room.createConstructionSite(nextBuild.pos, nextBuild.structure);
      if (buildResult === OK) {
        console.log(
          `Building ${nextBuild.structure} at (${nextBuild.pos.roomName}: ${nextBuild.pos.x}, ${nextBuild.pos.y})`
        );
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
