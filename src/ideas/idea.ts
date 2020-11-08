import { FigmentThought, FigmentThoughtName } from "thoughts/figmentThought";
import { BuildThought } from "thoughts/buildThought";
import { Figment } from "figment";
import { Imagination } from "imagination";
import PriorityQueue from "ts-priority-queue";

export abstract class Idea implements IBrain {
  public figmentThoughts: { [name: string]: { [instance: string]: FigmentThought } } = {};
  public buildThoughts: { [name: string]: { [instance: string]: BuildThought } } = {};
  public spawn: StructureSpawn;
  public imagination: Imagination;
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
  public hasConstructionSite: { [roomName: string]: boolean };
  public rcl = 0;
  public constructor(spawn: StructureSpawn, imagination: Imagination) {
    this.spawn = spawn;
    this.imagination = imagination;
    // Initialize memory
    if (!Memory.imagination.ideas[spawn.room.name]) {
      Memory.imagination.ideas[spawn.room.name] = {
        figmentCount: {}
      };
    }
    this.hasConstructionSite = {};
  }

  public ponder(): void {
    this.spawn = Game.spawns[this.spawn.name];
    if (Game.time % global.BUILD_PLAN_INTERVAL === 0) {
      this.buildQueue.clear();
    }
    const thoughts = { ...this.buildThoughts, ...this.figmentThoughts };
    for (const thoughtName in thoughts) {
      for (const thoughtInstance in thoughts[thoughtName]) {
        const thought = thoughts[thoughtName][thoughtInstance];
        thought.ponder();
      }
    }
    this.imagination.addStatus(`Build Queue: ${this.buildQueue.length}`);
    this.rcl = this.spawn.room.controller?.level === undefined ? 0 : this.spawn.room.controller.level;

    if (this.rcl > 1) {
      for (const room of this.spawn.room.neighborhood) {
        this.hasConstructionSite[room.name] = false;
        const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
          this.hasConstructionSite[room.name] = true;
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
  }

  private processSpawnQueue() {
    let currentPriority: number | null = null;
    while (this.spawnQueue.length > 0) {
      const nextSpawn = this.spawnQueue.dequeue();
      if (currentPriority === null) {
        currentPriority = nextSpawn.priority;
      } else if (nextSpawn.priority < currentPriority) {
        break;
      }
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
          underAttackCooldown: 5,
          combatReady: nextSpawn.combatReady,
          inCombat: false,
          spawnRoomName: this.spawn.room.name
        };
        this.spawn.spawnCreep(body, nextSpawn.name, { memory });
        this.imagination.addStatus(
          `Spawning ${nextSpawn.thoughtName}:${nextSpawn.thoughtInstance} priority ${nextSpawn.priority}`
        );
        this.adjustFigmentCount(nextSpawn.thoughtName, 1);
        break;
      }
    }
  }

  public addSpawn(payload: SpawnQueuePayload): void {
    this.spawnQueue.queue(payload);
  }

  public getFigmentCount(figmentThoughtName: FigmentThoughtName): number {
    const count = Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName];
    if (count) {
      return count;
    }
    return 0;
  }

  public adjustFigmentCount(figmentThoughtName: FigmentThoughtName | string, delta: number): void {
    const count = Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName];
    if (count) {
      Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName] += delta;
    } else {
      Memory.imagination.ideas[this.spawn.room.name].figmentCount[figmentThoughtName] = delta;
    }
  }

  public canBuild(roomName: string): boolean {
    if (this.hasConstructionSite[roomName]) {
      return false;
    }
    return true;
  }

  private processBuildQueue(): void {
    let buildOps = 1000;
    while (this.buildQueue.length > 0) {
      if (buildOps <= 0) {
        break;
      }
      buildOps--;

      let nextBuild = this.buildQueue.peek();
      const room = Game.rooms[nextBuild.pos.roomName];
      if (!room || !this.canBuild(room.name)) {
        continue;
      }
      nextBuild = this.buildQueue.dequeue();
      const buildResult = room.createConstructionSite(nextBuild.pos, nextBuild.structure);
      if (buildResult === OK) {
        this.imagination.addStatus(`Building ${nextBuild.structure} ${nextBuild.pos.toString()}`);
        break;
      }
    }
  }

  public addBuilds(
    positions: RoomPosition[],
    structure: StructureConstant,
    priority: number,
    firstAcceptable: boolean,
    showVisual: boolean
  ): void {
    for (const pos of positions) {
      this.addBuild(pos, structure, priority, showVisual);
      if (firstAcceptable) {
        break;
      }
    }
  }

  public addBuild(pos: RoomPosition, structure: StructureConstant, priority: number, showVisual: boolean): void {
    const buildPayload = {
      pos,
      structure,
      priority
    };
    if (showVisual) {
      const rv = new RoomVisual(pos.roomName);
      rv.circle(pos, { radius: 0.4, opacity: 0.2, fill: "#555555" });
      let text = `${priority}`;
      if (structure.length > 2) {
        text = `${structure.substring(0, 1)}:${priority}`;
      }
      rv.text(text, pos);
    }
    this.buildQueue.queue(buildPayload);
  }
}
