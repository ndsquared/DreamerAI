/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType } from "./idea";
import { AttackThought } from "thoughts/figmentThoughts/attackThought";
import { DefenseThought } from "thoughts/figmentThoughts/defenseThought";
import { Figment } from "figments/figment";
import { FigmentThought } from "thoughts/figmentThoughts/figmentThought";
import { FigmentThoughtType } from "thoughts/thought";
import { GetFigmentSpec } from "figments/figmentSpec";
import { HarvestThought } from "thoughts/figmentThoughts/harvestThought";
import { Imagination } from "imagination";
import { PatrolThought } from "thoughts/figmentThoughts/patrolThought";
import { PickupThought } from "thoughts/figmentThoughts/pickupThought";
import { ReserveThought } from "thoughts/figmentThoughts/reserveThought";
import { ScoutThought } from "thoughts/figmentThoughts/scoutThought";
import { TransferThought } from "thoughts/figmentThoughts/transferThought";
import { UpgradeThought } from "thoughts/figmentThoughts/upgradeThought";
import { WorkerThought } from "thoughts/figmentThoughts/workerThought";

interface ThoughtMapping {
  name: string;
  thought: any;
}

export class GenesisIdea extends Idea {
  private reset = true;
  public constructor(roomName: string, imagination: Imagination, type: IdeaType) {
    super(roomName, imagination, type);

    this.thoughts[FigmentThoughtType.HARVEST] = {};
    this.thoughts[FigmentThoughtType.RESERVE] = {};

    const figmentThoughts: ThoughtMapping[] = [
      { name: FigmentThoughtType.TRANSFER, thought: TransferThought },
      { name: FigmentThoughtType.PICKUP, thought: PickupThought },
      { name: FigmentThoughtType.WORKER, thought: WorkerThought },
      { name: FigmentThoughtType.UPGRADE, thought: UpgradeThought },
      { name: FigmentThoughtType.ATTACK, thought: AttackThought },
      { name: FigmentThoughtType.DEFENSE, thought: DefenseThought },
      { name: FigmentThoughtType.SCOUT, thought: ScoutThought },
      { name: FigmentThoughtType.PATROL, thought: PatrolThought }
    ];
    for (const figmentThought of figmentThoughts) {
      this.thoughts[figmentThought.name] = {};
      this.thoughts[figmentThought.name]["0"] = new figmentThought.thought(this, figmentThought.name, "0");
    }
  }

  public ponder(): void {
    for (const source of this.neighborhood.sources) {
      if (!this.thoughts[FigmentThoughtType.HARVEST][source.id]) {
        this.thoughts[FigmentThoughtType.HARVEST][source.id] = new HarvestThought(
          this,
          FigmentThoughtType.HARVEST,
          source
        );
      }
    }
    for (const roomName of this.cortex.getNeighborhoodRoomNames(this.roomName)) {
      if (roomName === this.roomName) {
        continue;
      }
      const room = Game.rooms[roomName];
      if (room) {
        if (!this.thoughts[FigmentThoughtType.RESERVE][room.name]) {
          this.thoughts[FigmentThoughtType.RESERVE][room.name] = new ReserveThought(
            this,
            FigmentThoughtType.RESERVE,
            room.name
          );
        }
      }
    }
    super.ponder();
  }

  public think(): void {
    if (!this.reset) {
      this.cortex.metabolism.spawnQueue[this.roomName].clear();
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

  // Minimum viable figments needed to support the economy and new spawns
  private inEmergency(): boolean {
    if (
      !this.figmentCount[FigmentThoughtType.TRANSFER] ||
      this.figmentCount[FigmentThoughtType.TRANSFER] === 0 ||
      !this.figmentCount[FigmentThoughtType.PICKUP] ||
      this.figmentCount[FigmentThoughtType.PICKUP] === 0 ||
      !this.figmentCount[FigmentThoughtType.HARVEST] ||
      this.figmentCount[FigmentThoughtType.HARVEST] === 0
    ) {
      return true;
    }
    return false;
  }

  private setQueuePriorities(): void {
    const enemies = this.cortex.metabolism.enemyQueue[this.roomName].length;
    for (const figmentType of Object.values(FigmentThoughtType)) {
      this.figmentPrefs[figmentType] = {
        priority: 10,
        needed: false
      };
      switch (figmentType) {
        case FigmentThoughtType.HARVEST: {
          const count = this.getFigmentCount(figmentType);
          const totalFigmentsInNeighborhood = this.cortex.getTotalFigmentsInNeighborhood(this.roomName);
          this.figmentPrefs[figmentType].priority = 12;
          if (count > 0 && totalFigmentsInNeighborhood < 5) {
            this.figmentPrefs[figmentType].priority = 10;
          } else if (count > 5 && totalFigmentsInNeighborhood < 15) {
            this.figmentPrefs[figmentType].priority = 3;
          }
          break;
        }
        case FigmentThoughtType.PICKUP:
          this.figmentPrefs[figmentType].priority = 11;
          break;
        case FigmentThoughtType.TRANSFER:
          this.figmentPrefs[figmentType].priority = 8;
          break;
        case FigmentThoughtType.TOWER_FILLER:
          this.figmentPrefs[figmentType].priority = 7;
          if (enemies > 0) {
            this.figmentPrefs[figmentType].priority = 16;
          }
          break;
        case FigmentThoughtType.SCOUT:
          this.figmentPrefs[figmentType].priority = 5;
          break;
        case FigmentThoughtType.PATROL:
          this.figmentPrefs[figmentType].priority = 5;
          break;
        case FigmentThoughtType.UPGRADE:
          this.figmentPrefs[figmentType].priority = 5;
          if (this.cortex.metabolism.inEcoMode(this.roomName)) {
            this.figmentPrefs[figmentType].priority = 0;
          }
          break;
        case FigmentThoughtType.WORKER:
          this.figmentPrefs[figmentType].priority = 4;
          if (this.cortex.metabolism.inEcoMode(this.roomName)) {
            this.figmentPrefs[figmentType].priority = 0;
          }
          break;
        case FigmentThoughtType.DEFENSE:
          this.figmentPrefs[figmentType].priority = 1;
          if (enemies > 0) {
            this.figmentPrefs[figmentType].priority = 15;
          }
          break;
        case FigmentThoughtType.ATTACK:
          this.figmentPrefs[figmentType].priority = 1;
          if (enemies > 0) {
            this.figmentPrefs[figmentType].priority = 14;
          }
          break;
        case FigmentThoughtType.RESERVE:
          this.figmentPrefs[figmentType].priority = 1;
          if (this.cortex.metabolism.inEcoMode(this.roomName)) {
            this.figmentPrefs[figmentType].priority = 0;
          }
          break;
        default:
          console.log(`hitting default for set queue priorities`);
          break;
      }
    }
  }

  private processThought(thought: FigmentThought): void {
    const outputs = this.cortex.metabolism.outputQueue[this.roomName].length;
    const constructionSites = this.cortex.metabolism.constructionSiteQueue[this.roomName].length ? 1 : 0;
    const repairTargets = this.cortex.metabolism.repairQueue[this.roomName].length ? 1 : 0;
    for (const figmentType in thought.figments) {
      let figmentNeeded = false;
      const count = this.getFigmentCount(figmentType);
      switch (figmentType) {
        case FigmentThoughtType.PICKUP: {
          // Dividing by zero is bad
          if (outputs) {
            const ratio = count / outputs;
            if (ratio < 0.85) {
              figmentNeeded = true;
            }
          }
          break;
        }
        case FigmentThoughtType.WORKER:
          if (count < constructionSites + repairTargets) {
            figmentNeeded = true;
          }
          break;
        default:
          figmentNeeded = thought.figmentNeeded(figmentType);
          break;
      }
      this.figmentPrefs[figmentType].needed = figmentNeeded;
      if (figmentNeeded) {
        const payload = {
          figmentName: Figment.GetUniqueName(),
          figmentSpec: GetFigmentSpec(figmentType),
          figmentType,
          priority: this.figmentPrefs[figmentType].priority,
          thoughtType: thought.type,
          thoughtInstance: thought.instance
        };
        this.addSpawn(payload);
      }
    }
  }

  private processSpawnQueue() {
    const room = this.room;
    if (!room) {
      return;
    }
    const spawn = this.cortex.getNextAvailableSpawn(room.name);
    if (!spawn) {
      return;
    }
    const currentSpawnTypes: string[] = [];
    const spawns = this.baseRoomObjects.spawns;
    for (const s of spawns) {
      if (s.spawning) {
        const figment = Game.creeps[s.spawning.name];
        currentSpawnTypes.push(figment.memory.figmentType);
      }
    }
    while (this.cortex.metabolism.spawnQueue[this.roomName].length > 0) {
      const nextSpawn = this.cortex.metabolism.spawnQueue[this.roomName].dequeue();
      if (currentSpawnTypes.includes(nextSpawn.figmentType)) {
        continue;
      }
      let energyAvailable = room.energyCapacityAvailable;
      if (this.inEmergency()) {
        energyAvailable = room.energyAvailable;
      }
      // Calculate the body and check if we can spawn
      const body = Figment.GetBodyFromBodySpec(nextSpawn.figmentSpec.bodySpec, energyAvailable);
      const status = spawn.spawnCreep(body, nextSpawn.figmentName, { dryRun: true });

      if (status === OK && body.length >= nextSpawn.figmentSpec.bodySpec.minParts) {
        const memory = {
          _trav: {},
          interneurons: [],
          roomName: this.roomName,
          figmentType: nextSpawn.figmentType,
          thoughtType: nextSpawn.thoughtType,
          thoughtInstance: nextSpawn.thoughtInstance,
          underAttack: false,
          underAttackCooldown: 5,
          combatReady: nextSpawn.figmentSpec.combatReady,
          inCombat: false
        };
        spawn.spawnCreep(body, nextSpawn.figmentName, { memory });
      }
    }
  }

  public addSpawn(payload: SpawnQueuePayload): void {
    this.cortex.metabolism.spawnQueue[this.roomName].queue(payload);
  }

  public getFigmentCount(figmentType: string): number {
    const count = this.figmentCount[figmentType];
    if (count) {
      return count;
    }
    return 0;
  }
}
