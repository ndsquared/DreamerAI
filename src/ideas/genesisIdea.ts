/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FigmentThought, FigmentType } from "thoughts/figmentThought";
import { Idea, IdeaType } from "./idea";
import { AttackThought } from "thoughts/attackThought";
import { CombatIdea } from "./combatIdea";
import { CreationIdea } from "./creationIdea";
import { DefenseThought } from "thoughts/defenseThought";
import { Figment } from "figments/figment";
import { GetFigmentSpec } from "figments/figmentSpec";
import { HarvestThought } from "../thoughts/harvestThought";
import { Imagination } from "imagination";
import { MetabolicIdea } from "./metabolicIdea";
import { PickupThought } from "thoughts/pickupThought";
import PriorityQueue from "ts-priority-queue";
import { ReserveThought } from "thoughts/reserveThought";
import { ScoutThought } from "thoughts/scoutThought";
import { Table } from "utils/visuals";
import { TransferThought } from "thoughts/transferThought";
import { UpgradeThought } from "thoughts/upgradeThought";
import { WorkerThought } from "thoughts/workerThought";

interface ThoughtMapping {
  name: string;
  thought: any;
}

export class GenesisIdea extends Idea {
  public spawnQueue: PriorityQueue<SpawnQueuePayload> = new PriorityQueue({
    comparator(a, b) {
      // Higher priority is dequeued first
      return b.priority - a.priority;
    }
  });
  private queuePriorities: { [type: string]: number } = {};
  private figmentNeeded: { [type: string]: boolean } = {};
  private memory: GenesisMemory;
  private reset = true;
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    super(spawn, imagination, type);
    // Initialize the memory
    if (!Memory.imagination.genesisIdeas[this.name]) {
      Memory.imagination.genesisIdeas[this.name] = {
        figmentCount: {}
      };
    }

    this.memory = Memory.imagination.genesisIdeas[this.name];

    const sources = _.sortBy(
      Game.rooms[spawn.pos.roomName].find(FIND_SOURCES),
      s => s.pos.findPathTo(spawn.pos, { ignoreCreeps: true }).length
    );

    this.thoughts[FigmentType.HARVEST] = {};
    this.thoughts[FigmentType.SCOUT] = {};
    this.thoughts[FigmentType.RESERVE] = {};

    for (const source of sources) {
      this.thoughts[FigmentType.HARVEST][source.id] = new HarvestThought(this, FigmentType.HARVEST, source);
    }

    const figmentThoughts: ThoughtMapping[] = [
      { name: FigmentType.TRANSFER, thought: TransferThought },
      { name: FigmentType.PICKUP, thought: PickupThought },
      { name: FigmentType.WORKER, thought: WorkerThought },
      { name: FigmentType.UPGRADE, thought: UpgradeThought },
      { name: FigmentType.ATTACK, thought: AttackThought },
      { name: FigmentType.DEFENSE, thought: DefenseThought }
    ];
    for (const figmentThought of figmentThoughts) {
      this.thoughts[figmentThought.name] = {};
      this.thoughts[figmentThought.name]["0"] = new figmentThought.thought(this, figmentThought.name, "0");
    }
  }

  public ponder(): void {
    this.memory = Memory.imagination.genesisIdeas[this.name];
    for (const roomName of this.spawn.room.neighborNames) {
      const room = Game.rooms[roomName];
      if (room) {
        const sources = _.sortBy(room.find(FIND_SOURCES));
        for (const source of sources) {
          if (!this.thoughts[FigmentType.HARVEST][source.id]) {
            this.thoughts[FigmentType.HARVEST][source.id] = new HarvestThought(this, FigmentType.HARVEST, source);
          }
        }
        if (!this.thoughts[FigmentType.RESERVE][room.name]) {
          this.thoughts[FigmentType.RESERVE][room.name] = new ReserveThought(this, FigmentType.RESERVE, room.name);
        }
      }
      if (!this.thoughts[FigmentType.SCOUT][roomName]) {
        this.thoughts[FigmentType.SCOUT][roomName] = new ScoutThought(this, FigmentType.SCOUT, roomName);
      }
    }
    super.ponder();
  }

  public think(): void {
    if (!this.reset) {
      this.spawnQueue.clear();
      this.ensureMinimumPickups();
      this.setQueuePriorities();
      for (const thoughtName in this.thoughts) {
        for (const thoughtInstance in this.thoughts[thoughtName]) {
          const thought = this.thoughts[thoughtName][thoughtInstance];
          if (thought instanceof FigmentThought) {
            // console.log(thought.name);
            this.processThought(thought);
          }
        }
      }
    }
    // this.imagination.addStatus(`Spawn Q: ${this.spawnQueue.length}`);
    this.processSpawnQueue();
    super.think();
  }

  private ensureMinimumPickups() {
    if (this.memory.figmentCount[FigmentType.PICKUP] && this.memory.figmentCount[FigmentType.PICKUP] > 1) {
      return;
    }
    const priorities = [11, 9];
    for (const priority of priorities) {
      const payload = {
        name: Figment.GetUniqueName(),
        figmentSpec: GetFigmentSpec(FigmentType.PICKUP),
        figmentType: FigmentType.PICKUP,
        priority,
        thoughtName: FigmentType.PICKUP,
        thoughtInstance: "0"
      };
      this.addSpawn(payload);
    }
  }

  public reflect(): void {
    super.reflect();
    if (this.reset) {
      this.reset = false;
    } else {
      this.contemplate();
    }
  }

  private contemplate(): void {
    if (!this.showStats) {
      return;
    }
    const tableData: string[][] = [["Type", "Count", "Priority", "Needed"]];
    let total = 0;
    for (const figmentType in this.memory.figmentCount) {
      const count = this.memory.figmentCount[figmentType];
      total += count;
      const priority = this.queuePriorities[figmentType];
      const needed = this.figmentNeeded[figmentType];
      tableData.push([figmentType, count.toString(), priority.toString(), String(needed)]);
    }
    tableData.push(["TOTAL", total.toString(), "", ""]);

    const tableAnchor = new RoomPosition(25, 1, this.spawn.room.name);
    let title = "Figment Stats";

    if (this.spawn.spawning) {
      const figment = new Figment(Game.creeps[this.spawn.spawning.name].id);
      const remainingTicks = this.spawn.spawning.remainingTime;
      title += ` (Spawning: ${figment.memory.figmentType} in ${remainingTicks})`;
    } else {
      let nextSpawn: SpawnQueuePayload | null = null;
      if (this.spawnQueue.length > 0) {
        nextSpawn = this.spawnQueue.peek();
      }
      if (nextSpawn) {
        title += ` (Next Spawn: ${nextSpawn.thoughtName})`;
      }
    }

    const table = new Table(title, tableAnchor, tableData);
    table.renderTable();
  }

  private inEmergency(): boolean {
    const figments = this.spawn.room.find(FIND_MY_CREEPS);
    if (figments.length < 3) {
      return true;
    }
    return false;
  }

  private setQueuePriorities(): void {
    let enemies = 0;
    enemies = (this.imagination.ideas[this.name][IdeaType.COMBAT] as CombatIdea).enemyQueue.length;
    for (const figmentType of Object.values(FigmentType)) {
      switch (figmentType) {
        case FigmentType.HARVEST: {
          const count = this.getFigmentCount(figmentType);
          this.queuePriorities[figmentType] = 12;
          if (count > 5) {
            this.queuePriorities[figmentType] = 4;
          } else if (count > 1) {
            this.queuePriorities[figmentType] = 7;
          } else if (count > 0) {
            this.queuePriorities[figmentType] = 10;
          }
          break;
        }
        case FigmentType.PICKUP:
          this.queuePriorities[figmentType] = 11;
          break;
        case FigmentType.TRANSFER:
          this.queuePriorities[figmentType] = 8;
          break;
        case FigmentType.UPGRADE:
          this.queuePriorities[figmentType] = 6;
          break;
        case FigmentType.WORKER:
          this.queuePriorities[figmentType] = 5;
          break;
        case FigmentType.DEFENSE:
          this.queuePriorities[figmentType] = 1;
          if (enemies > 0) {
            this.queuePriorities[figmentType] = 15;
          }
          break;
        case FigmentType.ATTACK:
          this.queuePriorities[figmentType] = 1;
          if (enemies > 0) {
            this.queuePriorities[figmentType] = 14;
          }
          break;
        case FigmentType.RESERVE:
          this.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.SCOUT:
          this.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.TOWER_FILLER:
          this.queuePriorities[figmentType] = 1;
          if (enemies > 0) {
            this.queuePriorities[figmentType] = 16;
          }
          break;
        default:
          console.log(`hitting default for set queue priorities`);
          break;
      }
    }
  }

  private processThought(thought: FigmentThought): void {
    let outputs = 0;
    let constructionSites = 0;
    let repairTargets = 0;
    outputs = (this.imagination.ideas[this.name][IdeaType.METABOLIC] as MetabolicIdea).getOutputs();
    constructionSites = (this.imagination.ideas[this.name][IdeaType.CREATION] as CreationIdea).constructionSiteQueue
      .length
      ? 1
      : 0;
    repairTargets = (this.imagination.ideas[this.name][IdeaType.CREATION] as CreationIdea).repairQueue.length ? 1 : 0;
    // console.log(thought.name);
    for (const figmentType in thought.figments) {
      // console.log(figmentType);
      let figmentNeeded = false;
      const count = this.getFigmentCount(figmentType);
      switch (figmentType) {
        case FigmentType.PICKUP: {
          // Dividing by zero is bad
          if (outputs) {
            const ratio = count / outputs;
            if (ratio < 0.85) {
              figmentNeeded = true;
            }
          }
          break;
        }
        case FigmentType.WORKER:
          if (count < constructionSites + repairTargets + 2) {
            figmentNeeded = true;
          }
          break;
        default:
          figmentNeeded = thought.figmentNeeded(figmentType);
          break;
      }
      this.figmentNeeded[figmentType] = figmentNeeded;
      if (figmentNeeded) {
        const payload = {
          name: Figment.GetUniqueName(),
          figmentSpec: GetFigmentSpec(figmentType),
          figmentType,
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
    // let statusSpawn: SpawnQueuePayload | null = null;
    if (this.spawnQueue.length > 0) {
      const nextSpawn = this.spawnQueue.peek();
      // statusSpawn = nextSpawn;
      // Set minimum energy to use for the next figment spawn
      let energyAvailable = this.spawn.room.energyCapacityAvailable;
      if (
        this.inEmergency() ||
        !this.memory.figmentCount[FigmentType.TRANSFER] ||
        this.memory.figmentCount[FigmentType.TRANSFER] === 0
      ) {
        energyAvailable = this.spawn.room.energyAvailable;
      }
      // Calculate the body and check if we can spawn
      const body = Figment.GetBodyFromBodySpec(nextSpawn.figmentSpec.bodySpec, energyAvailable);
      const status = this.spawn.spawnCreep(body, nextSpawn.name, { dryRun: true });
      // console.log(nextSpawn.thoughtName);
      // console.log(status);
      // console.log(body.toString());

      if (status === OK && body.length >= nextSpawn.figmentSpec.bodySpec.minParts) {
        const memory = {
          _trav: {},
          interneurons: [],
          ideaName: this.name,
          figmentType: nextSpawn.figmentType,
          thoughtType: nextSpawn.thoughtName,
          thoughtInstance: nextSpawn.thoughtInstance,
          underAttack: false,
          underAttackCooldown: 5,
          combatReady: nextSpawn.figmentSpec.combatReady,
          inCombat: false
        };
        this.spawn.spawnCreep(body, nextSpawn.name, { memory });
        // statusSpawn = null;
        this.spawnQueue.dequeue();
        // this.imagination.addStatus(
        //   `Spawning ${nextSpawn.thoughtName}:${nextSpawn.thoughtInstance} w/ priority ${nextSpawn.priority}`
        // );
      }
      // if (statusSpawn) {
      // const cost = _.sum(body, b => BODYPART_COST[b]);
      // this.imagination.addStatus(`Next Spawn: ${statusSpawn.thoughtName} w/ priority ${statusSpawn.priority}`);
      // }
    }
  }

  public addSpawn(payload: SpawnQueuePayload): void {
    this.spawnQueue.queue(payload);
  }

  public getFigmentCount(figmentType: string): number {
    const count = this.memory.figmentCount[figmentType];
    if (count) {
      return count;
    }
    return 0;
  }
}
