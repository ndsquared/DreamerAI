import { FigmentThought, FigmentType } from "./figmentThought";
import { PathFindWithRoad, isEnergyStructure, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class TransferThought extends FigmentThought {
  private container: StructureContainer | null = null;
  private storage: StructureStorage | null = null;
  private transferPriority: StructureConstant[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER];
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.TRANSFER] = [];
    this.figments[FigmentType.TOWER_FILLER] = [];
  }

  private getNextWithdrawTarget(): StoreStructure | null {
    if (this.storage) {
      return this.storage;
    } else if (this.container) {
      return this.container;
    }

    return null;
  }

  private getNextTransferTarget(figment: Figment): StoreStructure {
    const targets: StoreStructure[] = [];
    const structures = this.idea.spawn.room.find(FIND_STRUCTURES);
    for (const structureConstant of this.transferPriority) {
      for (const structure of structures) {
        if (structure.structureType === STRUCTURE_TOWER) {
          if (structure.energy < 951) {
            targets.push(structure);
          }
        } else if (
          isEnergyStructure(structure) &&
          structure.structureType === structureConstant &&
          structure.hasEnergyCapacity
        ) {
          targets.push(structure);
        } else if (
          !isEnergyStructure(structure) &&
          isStoreStructure(structure) &&
          structure.structureType === structureConstant &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        ) {
          targets.push(structure);
        }
      }
      if (targets.length) {
        break;
      }
    }

    return _.first(_.sortBy(targets, t => PathFindWithRoad(figment.pos, t.pos).cost));
  }

  public ponder(): void {
    if (!this.container) {
      if (this.idea.spawn) {
        const containers = this.idea.spawn.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => {
            if (s.structureType === STRUCTURE_CONTAINER) {
              return true;
            }
            return false;
          }
        });
        if (containers.length) {
          this.container = containers[0] as StructureContainer;
        }
      }
    } else {
      this.container = Game.getObjectById(this.container.id);
    }
    if (!this.storage) {
      if (this.idea.spawn.room.storage) {
        this.storage = this.idea.spawn.room.storage;
      }
    } else {
      this.storage = Game.getObjectById(this.storage.id);
    }
    super.ponder();
  }

  public handleFigment(figment: Figment): void {
    if (figment.memory.figmentType === FigmentType.TOWER_FILLER) {
      this.transferPriority = [STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN];
    }
    if (figment.store.getUsedCapacity() === 0) {
      const target = this.getNextWithdrawTarget();
      if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      }
    } else {
      const target = this.getNextTransferTarget(figment);
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(figmentType: string): boolean {
    if (!this.storage && !this.container) {
      return false;
    }
    if (figmentType === FigmentType.TRANSFER) {
      if (this.figments[figmentType].length === 1) {
        const ttl = this.figments[figmentType][0].ticksToLive;
        if (ttl && ttl < 200) {
          return true;
        }
      }
      return this.figments[figmentType].length < 1;
    } else if (figmentType === FigmentType.TOWER_FILLER) {
      // TODO: Optimize this call
      const towers = this.idea.spawn.room.find(FIND_STRUCTURES, {
        filter: s => {
          if (s.structureType === STRUCTURE_TOWER) {
            return true;
          }
          return false;
        }
      });
      if (towers.length === 0) {
        return false;
      }
      return this.figments[figmentType].length < 1;
    }
    return false;
  }
}
