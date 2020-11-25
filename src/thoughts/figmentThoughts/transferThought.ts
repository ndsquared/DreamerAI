import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class TransferThought extends FigmentThought {
  private containerId: Id<StructureContainer> | undefined = undefined;
  private storageId: Id<StructureStorage> | undefined = undefined;
  private transferPriority: StructureConstant[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER];
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.TRANSFER] = [];
    this.figments[FigmentThoughtType.TOWER_FILLER] = [];
  }

  public get container(): StructureContainer | null {
    if (this.containerId) {
      return Game.getObjectById(this.containerId);
    }
    this.containerId = undefined;
    return null;
  }

  public get storage(): StructureStorage | null {
    if (this.storageId) {
      return Game.getObjectById(this.storageId);
    }
    this.storageId = undefined;
    return null;
  }

  private getNextWithdrawTarget(): StoreStructure | undefined {
    if (this.storage && this.storage.store.getUsedCapacity() > 0) {
      return this.storage;
    } else if (this.container && this.container.store.getUsedCapacity() > 0) {
      return this.container;
    }

    return undefined;
  }

  private getNextTransferTarget(figment: Figment): StoreStructure {
    let targets: StoreStructure[] = [];
    for (const structureConstant of this.transferPriority) {
      if (structureConstant === STRUCTURE_EXTENSION) {
        const extensions = _.filter(this.idea.baseRoomObjects.extensions, e => e.hasEnergyCapacity);
        targets = targets.concat(extensions);
      } else if (structureConstant === STRUCTURE_SPAWN) {
        const spawns = _.filter(this.idea.baseRoomObjects.spawns, s => s.hasEnergyCapacity);
        targets = targets.concat(spawns);
      } else if (structureConstant === STRUCTURE_TOWER) {
        const towers = _.filter(this.idea.baseRoomObjects.towers, t => t.energy < 501);
        targets = targets.concat(towers);
      }
      if (targets.length) {
        break;
      }
    }

    return _.first(_.sortBy(targets, t => PathFindWithRoad(figment.pos, t.pos).cost));
  }

  public ponder(): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    // TODO: Need to refactor for neighborhood proper
    if (!this.container) {
      if (this.idea.baseRoomObjects.spawnContainers.length) {
        this.containerId = this.idea.baseRoomObjects.spawnContainers[0].id;
      }
    }
    if (!this.storage) {
      if (room.storage) {
        this.storageId = room.storage.id;
      }
    }
  }

  public handleFigment(figment: Figment): boolean {
    const room = this.idea.room;
    if (!room) {
      return false;
    }
    if (figment.memory.figmentType === FigmentThoughtType.TOWER_FILLER) {
      this.transferPriority = [STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN];
    }
    if (figment.store.getUsedCapacity() === 0) {
      const target = this.getNextWithdrawTarget();
      const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
      if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      } else {
        figment.addNeuron(NeuronType.SLEEP, "", baseOriginPos, {
          sleepTicks: 10,
          moveOffRoadDuringImpulse: true,
          targetRange: 15
        });
      }
    } else {
      const target = this.getNextTransferTarget(figment);
      const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      } else {
        figment.addNeuron(NeuronType.SLEEP, "", baseOriginPos, {
          sleepTicks: 10,
          moveOffRoadDuringImpulse: true,
          targetRange: 15
        });
      }
    }
    return true;
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.storage && !this.container) {
      return false;
    }
    if (figmentType === FigmentThoughtType.TRANSFER) {
      if (this.figments[figmentType].length === 1) {
        const ttl = this.figments[figmentType][0].ticksToLive;
        if (ttl && ttl < 200) {
          return true;
        }
      }
      return this.figments[figmentType].length < 1;
    } else if (figmentType === FigmentThoughtType.TOWER_FILLER) {
      if (this.idea.baseRoomObjects.towers.length === 0) {
        return false;
      }
      return this.figments[figmentType].length < 1;
    }
    return false;
  }
}
