import { BuildThoughtName } from "thoughts/buildThought";
import { ContainerThought } from "thoughts/containerThought";
import { ExtensionThought } from "thoughts/extensionThought";
import { FigmentThoughtName } from "thoughts/figmentThought";
import { HarvestThought } from "../thoughts/harvestThought";
import { Idea } from "./idea";
import { PickupThought } from "thoughts/pickupThought";
import { RepairThought } from "thoughts/repairThought";
import { RoadThought } from "thoughts/roadThought";
import { ScoutThought } from "thoughts/scoutThought";
import { StorageThought } from "thoughts/storageThough";
import { TowerThought } from "thoughts/towerThought";
import { TransferThought } from "thoughts/transferThought";
import { WorkerThought } from "thoughts/workerThought";

export class TabulaRasaIdea extends Idea {
  public constructor(spawn: StructureSpawn) {
    super(spawn);
    const sources = _.sortBy(
      Game.rooms[spawn.pos.roomName].find(FIND_SOURCES),
      s => s.pos.findPathTo(spawn.pos, { ignoreCreeps: true }).length
    );
    this.figmentThoughts[FigmentThoughtName.HARVEST] = [];
    for (let index = 0; index < sources.length; index++) {
      const source = sources[index];
      this.figmentThoughts[FigmentThoughtName.HARVEST].push(
        new HarvestThought(this, FigmentThoughtName.HARVEST, index, source)
      );
    }
    this.figmentThoughts[FigmentThoughtName.PICKUP] = [new PickupThought(this, FigmentThoughtName.PICKUP, 0)];
    this.figmentThoughts[FigmentThoughtName.TRANSFER] = [new TransferThought(this, FigmentThoughtName.TRANSFER, 0)];
    this.figmentThoughts[FigmentThoughtName.WORKER] = [new WorkerThought(this, FigmentThoughtName.WORKER, 0)];
    this.figmentThoughts[FigmentThoughtName.REPAIR] = [new RepairThought(this, FigmentThoughtName.REPAIR, 0)];
    this.figmentThoughts[FigmentThoughtName.SCOUT] = [new ScoutThought(this, FigmentThoughtName.SCOUT, 0)];
    this.buildThoughts[BuildThoughtName.EXTENSION] = [new ExtensionThought(this, BuildThoughtName.EXTENSION, 0)];
    this.buildThoughts[BuildThoughtName.ROAD] = [new RoadThought(this, BuildThoughtName.ROAD, 0)];
    this.buildThoughts[BuildThoughtName.CONTAINER] = [new ContainerThought(this, BuildThoughtName.CONTAINER, 0)];
    this.buildThoughts[BuildThoughtName.TOWER] = [new TowerThought(this, BuildThoughtName.TOWER, 0)];
    this.buildThoughts[BuildThoughtName.STORAGE] = [new StorageThought(this, BuildThoughtName.STORAGE, 0)];
  }
}
