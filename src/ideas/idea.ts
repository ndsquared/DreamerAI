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
  private emergencyMode = false;
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
    this.emergencyMode = this.inEmergency();
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

    for (const room of this.spawn.room.neighborhood) {
      this.hasConstructionSite[room.name] = false;
      const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
      if (constructionSites.length > 0) {
        this.hasConstructionSite[room.name] = true;
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

  private inEmergency(): boolean {
    const figments = this.spawn.room.find(FIND_MY_CREEPS);
    if (figments.length < 3) {
      return true;
    }
    return false;
  }

  private processSpawnQueue() {
    let currentPriority: number | null = null;
    let statusSpawn: SpawnQueuePayload | null = null;
    while (this.spawnQueue.length > 0) {
      const nextSpawn = this.spawnQueue.dequeue();
      let energyAvailable = this.spawn.room.energyCapacityAvailable;
      if (this.emergencyMode || nextSpawn.thoughtName === FigmentThoughtName.TRANSFER) {
        energyAvailable = this.spawn.room.energyAvailable;
      }
      const body = Figment.GetBodyFromBodySpec(nextSpawn.bodySpec, energyAvailable);
      const roomEnergyCapacity = this.spawn.room.energyCapacityAvailable;
      const bodyCost = _.sum(body, b => BODYPART_COST[b]);
      // console.log(
      //   `nextSpawn: ${nextSpawn.thoughtName}, cost: ${bodyCost}/${roomEnergyCapacity}, body: ${body.toString()}`
      // );
      if (body.length === 0 || bodyCost > roomEnergyCapacity) {
        continue;
      }
      if (!statusSpawn) {
        statusSpawn = nextSpawn;
      }
      if (currentPriority === null) {
        currentPriority = nextSpawn.priority;
      } else if (nextSpawn.priority < currentPriority) {
        break;
      }
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
        statusSpawn = null;
        this.imagination.addStatus(
          `Spawning ${nextSpawn.thoughtName}:${nextSpawn.thoughtInstance} priority ${nextSpawn.priority}`
        );
        this.adjustFigmentCount(nextSpawn.thoughtName, 1);
        break;
      }
    }
    if (statusSpawn) {
      this.imagination.addStatus(`Next Spawn: ${statusSpawn.thoughtName} with priority ${statusSpawn.priority}`);
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
    let statusBuild: BuildQueuePayload | null = null;
    while (this.buildQueue.length > 0) {
      if (buildOps <= 0) {
        break;
      }
      buildOps--;

      let nextBuild = this.buildQueue.peek();
      statusBuild = nextBuild;
      const room = Game.rooms[nextBuild.pos.roomName];
      if (!room || !this.canBuild(room.name)) {
        continue;
      }
      nextBuild = this.buildQueue.dequeue();
      const buildResult = room.createConstructionSite(nextBuild.pos, nextBuild.structure);
      if (buildResult === OK) {
        this.imagination.addStatus(`Building ${nextBuild.structure} ${nextBuild.pos.toString()}`);
        statusBuild = null;
        break;
      }
    }
    if (statusBuild) {
      this.imagination.addStatus(`Next Build: ${statusBuild.structure} with priority ${statusBuild.priority}`);
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
