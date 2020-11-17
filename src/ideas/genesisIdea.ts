import { FigmentThought, FigmentType } from "thoughts/figmentThought";
import { Idea, IdeaType } from "./idea";
import { CreationIdea } from "./creationIdea";
import { Figment } from "figments/figment";
import { GetFigmentSpec } from "figments/figmentSpec";
import { Imagination } from "imagination";
import { MetabolicIdea } from "./metabolicIdea";
import PriorityQueue from "ts-priority-queue";
import { Table } from "utils/visuals";

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
  private figmentCountAdjustments: FigmentCountAdjustment[] = [];
  private reset = true;
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea) {
    super(spawn, imagination, type, idea);
    this.memory = {
      figmentCount: {}
    };
    // Initialize the memory
    if (!Memory.imagination.genesisIdeas[this.name]) {
      Memory.imagination.genesisIdeas[this.name] = this.memory;
    }
  }

  public ponder(): void {
    this.memory = Memory.imagination.genesisIdeas[this.name];
    this.spawn = Game.spawns[this.spawn.name];
  }

  public think(): void {
    if (!this.reset) {
      this.spawnQueue.clear();
      this.ensureMinimumPickups();
      this.setQueuePriorities();
      if (this.idea) {
        for (const thoughtName in this.idea.thoughts) {
          for (const thoughtInstance in this.idea.thoughts[thoughtName]) {
            const thought = this.idea.thoughts[thoughtName][thoughtInstance];
            if (thought instanceof FigmentThought) {
              // console.log(thought.name);
              this.processThought(thought);
            }
          }
        }
      }
    }
    // this.imagination.addStatus(`Spawn Q: ${this.spawnQueue.length}`);
    this.processSpawnQueue();
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
        priority,
        thoughtName: FigmentType.PICKUP,
        thoughtInstance: "0"
      };
      this.addSpawn(payload);
    }
  }

  public reflect(): void {
    this.processFigmentCountAdjustments();
    Memory.imagination.genesisIdeas[this.name] = this.memory;
    if (this.reset) {
      this.reset = false;
    } else {
      this.contemplate();
    }
  }

  private contemplate(): void {
    if (!this.idea || !this.idea.showStats) {
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
      title += ` (Spawning: ${figment.memory.thoughtType} in ${remainingTicks})`;
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
    if (this.idea) {
      outputs = (this.idea.ideas[IdeaType.METABOLIC] as MetabolicIdea).getOutputs();
      constructionSites = (this.idea.ideas[IdeaType.CREATION] as CreationIdea).constructionSiteQueue.length;
      repairTargets = (this.idea.ideas[IdeaType.CREATION] as CreationIdea).repairQueue.length;
    }
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
          if (count < constructionSites + repairTargets + 1) {
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
        this.adjustFigmentCount(nextSpawn.thoughtName, 1);
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

  private processFigmentCountAdjustments(): void {
    while (this.figmentCountAdjustments.length > 0) {
      const adjustment = this.figmentCountAdjustments.pop();
      if (adjustment) {
        const count = this.memory.figmentCount[adjustment.type];
        if (count) {
          this.memory.figmentCount[adjustment.type] += adjustment.delta;
        } else {
          this.memory.figmentCount[adjustment.type] = adjustment.delta;
        }
      }
    }
  }

  public adjustFigmentCount(type: string, delta: number): void {
    this.figmentCountAdjustments.push({
      type,
      delta
    });
  }
}
