/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FigmentThought, FigmentType } from "thoughts/figmentThought";
import { Idea, IdeaType } from "./idea";
import { AttackThought } from "thoughts/attackThought";
import { DefenseThought } from "thoughts/defenseThought";
import { Figment } from "figments/figment";
import { GetFigmentSpec } from "figments/figmentSpec";
import { HarvestThought } from "../thoughts/harvestThought";
import { Imagination } from "imagination";
import { PickupThought } from "thoughts/pickupThought";
import { ReserveThought } from "thoughts/reserveThought";
import { ScoutThought } from "thoughts/scoutThought";
import { TransferThought } from "thoughts/transferThought";
import { UpgradeThought } from "thoughts/upgradeThought";
import { WorkerThought } from "thoughts/workerThought";

interface ThoughtMapping {
  name: string;
  thought: any;
}

export class GenesisIdea extends Idea {
  private reset = true;
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    super(spawn, imagination, type);

    this.thoughts[FigmentType.HARVEST] = {};
    this.thoughts[FigmentType.SCOUT] = {};
    this.thoughts[FigmentType.RESERVE] = {};

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
    for (const source of this.hippocampus.sources) {
      if (!this.thoughts[FigmentType.HARVEST][source.id]) {
        this.thoughts[FigmentType.HARVEST][source.id] = new HarvestThought(this, FigmentType.HARVEST, source);
      }
    }
    for (const roomName of this.spawn.room.neighborNames) {
      const room = Game.rooms[roomName];
      if (room) {
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
      this.hippocampus.spawnQueue.clear();
      this.ensureMinimumPickups();
      this.setQueuePriorities();
      for (const thoughtName in this.thoughts) {
        for (const thoughtInstance in this.thoughts[thoughtName]) {
          const thought = this.thoughts[thoughtName][thoughtInstance];
          if (thought instanceof FigmentThought) {
            this.processThought(thought);
          }
        }
      }
    }
    this.processSpawnQueue();
    super.think();
  }

  public reflect(): void {
    super.reflect();
    if (this.reset) {
      this.reset = false;
    }
  }

  private ensureMinimumPickups() {
    if (
      this.hippocampus.memoryGen.figmentCount[FigmentType.PICKUP] &&
      this.hippocampus.memoryGen.figmentCount[FigmentType.PICKUP] > 1
    ) {
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

  // Minimum viable figments needed to support the economy and new spawns
  private inEmergency(): boolean {
    if (
      !this.hippocampus.memoryGen.figmentCount[FigmentType.TRANSFER] ||
      this.hippocampus.memoryGen.figmentCount[FigmentType.TRANSFER] === 0 ||
      !this.hippocampus.memoryGen.figmentCount[FigmentType.PICKUP] ||
      this.hippocampus.memoryGen.figmentCount[FigmentType.PICKUP] === 0 ||
      !this.hippocampus.memoryGen.figmentCount[FigmentType.HARVEST] ||
      this.hippocampus.memoryGen.figmentCount[FigmentType.HARVEST] === 0
    ) {
      return true;
    }
    return false;
  }

  private setQueuePriorities(): void {
    const enemies = this.hippocampus.enemyQueue.length;
    for (const figmentType of Object.values(FigmentType)) {
      switch (figmentType) {
        case FigmentType.HARVEST: {
          const count = this.getFigmentCount(figmentType);
          this.hippocampus.queuePriorities[figmentType] = 12;
          if (count > 1) {
            this.hippocampus.queuePriorities[figmentType] = 7;
          } else if (count > 0) {
            this.hippocampus.queuePriorities[figmentType] = 10;
          }
          break;
        }
        case FigmentType.PICKUP:
          this.hippocampus.queuePriorities[figmentType] = 11;
          break;
        case FigmentType.TRANSFER:
          this.hippocampus.queuePriorities[figmentType] = 8;
          break;
        case FigmentType.UPGRADE:
          this.hippocampus.queuePriorities[figmentType] = 6;
          break;
        case FigmentType.WORKER:
          this.hippocampus.queuePriorities[figmentType] = 5;
          break;
        case FigmentType.DEFENSE:
          this.hippocampus.queuePriorities[figmentType] = 1;
          if (enemies > 0) {
            this.hippocampus.queuePriorities[figmentType] = 15;
          }
          break;
        case FigmentType.ATTACK:
          this.hippocampus.queuePriorities[figmentType] = 1;
          if (enemies > 0) {
            this.hippocampus.queuePriorities[figmentType] = 14;
          }
          break;
        case FigmentType.RESERVE:
          this.hippocampus.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.SCOUT:
          this.hippocampus.queuePriorities[figmentType] = 1;
          break;
        case FigmentType.TOWER_FILLER:
          this.hippocampus.queuePriorities[figmentType] = 1;
          if (enemies > 0) {
            this.hippocampus.queuePriorities[figmentType] = 16;
          }
          break;
        default:
          console.log(`hitting default for set queue priorities`);
          break;
      }
    }
  }

  private processThought(thought: FigmentThought): void {
    const outputs = this.hippocampus.outputQueue.length;
    const constructionSites = this.hippocampus.constructionSiteQueue.length ? 1 : 0;
    const repairTargets = this.hippocampus.repairQueue.length ? 1 : 0;
    for (const figmentType in thought.figments) {
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
          if (count < constructionSites + repairTargets) {
            figmentNeeded = true;
          }
          break;
        default:
          figmentNeeded = thought.figmentNeeded(figmentType);
          break;
      }
      this.hippocampus.figmentNeeded[figmentType] = figmentNeeded;
      if (figmentNeeded) {
        const payload = {
          name: Figment.GetUniqueName(),
          figmentSpec: GetFigmentSpec(figmentType),
          figmentType,
          priority: this.hippocampus.queuePriorities[figmentType],
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
    if (this.hippocampus.spawnQueue.length > 0) {
      const nextSpawn = this.hippocampus.spawnQueue.peek();
      let energyAvailable = this.spawn.room.energyCapacityAvailable;
      if (this.inEmergency()) {
        energyAvailable = this.spawn.room.energyAvailable;
      }
      // Calculate the body and check if we can spawn
      const body = Figment.GetBodyFromBodySpec(nextSpawn.figmentSpec.bodySpec, energyAvailable);
      const status = this.spawn.spawnCreep(body, nextSpawn.name, { dryRun: true });

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
        this.hippocampus.spawnQueue.dequeue();
      }
    }
  }

  public addSpawn(payload: SpawnQueuePayload): void {
    this.hippocampus.spawnQueue.queue(payload);
  }

  public getFigmentCount(figmentType: string): number {
    const count = this.hippocampus.memoryGen.figmentCount[figmentType];
    if (count) {
      return count;
    }
    return 0;
  }
}
