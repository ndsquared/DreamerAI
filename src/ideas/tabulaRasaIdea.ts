/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AttackThought } from "thoughts/attackThought";
import { BuildThoughtName } from "thoughts/buildThought";
import { ContainerThought } from "thoughts/containerThought";
import { DefenseThought } from "thoughts/defenseThought";
import { ExtensionThought } from "thoughts/extensionThought";
import { FigmentThoughtName } from "thoughts/figmentThought";
import { HarvestThought } from "../thoughts/harvestThought";
import { Idea } from "./idea";
import { LinkThought } from "thoughts/linkThought";
import { PickupThought } from "thoughts/pickupThought";
import { RampartThought } from "thoughts/rampartThought";
import { ReserveThought } from "thoughts/reserveThought";
import { RoadThought } from "thoughts/roadThought";
import { ScoutThought } from "thoughts/scoutThought";
import { StorageThought } from "thoughts/storageThought";
import { TowerThought } from "thoughts/towerThought";
import { TransferThought } from "thoughts/transferThought";
import { UpgradeThought } from "thoughts/upgradeThought";
import { WorkerThought } from "thoughts/workerThought";

interface ThoughtMapping {
  name: string;
  thought: any;
}

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn) {
    super(spawn);
    const sources = _.sortBy(
      Game.rooms[spawn.pos.roomName].find(FIND_SOURCES),
      s => s.pos.findPathTo(spawn.pos, { ignoreCreeps: true }).length
    );

    // Initialize thoughts
    this.figmentThoughts[FigmentThoughtName.HARVEST] = {};
    this.figmentThoughts[FigmentThoughtName.PICKUP] = {};
    this.figmentThoughts[FigmentThoughtName.REMOTE_HARVEST] = {};
    this.figmentThoughts[FigmentThoughtName.REMOTE_PICKUP] = {};
    this.figmentThoughts[FigmentThoughtName.SCOUT] = {};
    this.figmentThoughts[FigmentThoughtName.RESERVE] = {};

    for (const source of sources) {
      this.figmentThoughts[FigmentThoughtName.HARVEST][source.id] = new HarvestThought(
        this,
        FigmentThoughtName.HARVEST,
        source
      );
      this.figmentThoughts[FigmentThoughtName.PICKUP][source.id] = new PickupThought(
        this,
        FigmentThoughtName.PICKUP,
        source
      );
    }

    const figmentThoughts: ThoughtMapping[] = [
      { name: FigmentThoughtName.TRANSFER, thought: TransferThought },
      { name: FigmentThoughtName.WORKER, thought: WorkerThought },
      { name: FigmentThoughtName.UPGRADE, thought: UpgradeThought },
      { name: FigmentThoughtName.ATTACK, thought: AttackThought },
      { name: FigmentThoughtName.DEFENSE, thought: DefenseThought }
    ];
    for (const figmentThought of figmentThoughts) {
      this.figmentThoughts[figmentThought.name] = {};
      this.figmentThoughts[figmentThought.name]["0"] = new figmentThought.thought(this, figmentThought.name, "0");
    }

    const buildThoughts: ThoughtMapping[] = [
      { name: BuildThoughtName.EXTENSION, thought: ExtensionThought },
      { name: BuildThoughtName.ROAD, thought: RoadThought },
      { name: BuildThoughtName.CONTAINER, thought: ContainerThought },
      { name: BuildThoughtName.TOWER, thought: TowerThought },
      { name: BuildThoughtName.STORAGE, thought: StorageThought },
      { name: BuildThoughtName.RAMPART, thought: RampartThought },
      { name: BuildThoughtName.LINK, thought: LinkThought }
    ];
    for (const buildThought of buildThoughts) {
      this.buildThoughts[buildThought.name] = {};
      this.buildThoughts[buildThought.name]["0"] = new buildThought.thought(this, buildThought.name, "0");
    }
  }

  public ponder(): void {
    for (const roomName of this.spawn.room.neighborNames) {
      const room = Game.rooms[roomName];
      if (room) {
        const sources = _.sortBy(room.find(FIND_SOURCES));
        for (const source of sources) {
          if (!this.figmentThoughts[FigmentThoughtName.REMOTE_HARVEST][source.id]) {
            this.figmentThoughts[FigmentThoughtName.REMOTE_HARVEST][source.id] = new HarvestThought(
              this,
              FigmentThoughtName.REMOTE_HARVEST,
              source
            );
            this.figmentThoughts[FigmentThoughtName.REMOTE_PICKUP][source.id] = new PickupThought(
              this,
              FigmentThoughtName.REMOTE_PICKUP,
              source
            );
          }
        }
        if (!this.figmentThoughts[FigmentThoughtName.RESERVE][room.name]) {
          this.figmentThoughts[FigmentThoughtName.RESERVE][room.name] = new ReserveThought(
            this,
            FigmentThoughtName.RESERVE,
            room.name
          );
        }
      } else {
        if (!this.figmentThoughts[FigmentThoughtName.SCOUT][roomName]) {
          this.figmentThoughts[FigmentThoughtName.SCOUT][roomName] = new ScoutThought(
            this,
            FigmentThoughtName.SCOUT,
            roomName
          );
        }
      }
    }
    super.ponder();
  }
}
