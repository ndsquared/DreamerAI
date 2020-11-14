import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class UpgradeThought extends FigmentThought {
  private controller: StructureController | undefined = undefined;
  private container: StructureContainer | undefined = undefined;
  private storage: StructureStorage | undefined = undefined;
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.UPGRADE] = [];
  }

  private getNextWithdrawTarget(): StoreStructure {
    if (this.container) {
      return this.container;
    } else if (this.storage) {
      return this.storage;
    }

    return this.idea.spawn;
  }

  public handleFigment(figment: Figment): void {
    if (!this.controller) {
      this.controller = this.idea.spawn.room.controller;
    }
    if (!this.container) {
      if (this.controller) {
        const containers = this.controller.pos.findInRange(FIND_STRUCTURES, 1, {
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
    }
    if (!this.storage) {
      if (this.idea.spawn.room.storage) {
        this.storage = this.idea.spawn.room.storage;
      }
    }
    if (figment.store.getUsedCapacity() > 0) {
      if (this.controller && this.controller.my) {
        figment.addNeuron(NeuronType.UPGRADE, this.controller.id, this.controller.pos);
      }
    } else {
      const target = this.getNextWithdrawTarget();
      figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
    }
  }

  public figmentNeeded(figmentType: string): boolean {
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(WORK));
    const storage = this.idea.spawn.room.find(FIND_STRUCTURES, {
      filter: s => {
        if (s.structureType === STRUCTURE_STORAGE) {
          return true;
        }
        return false;
      }
    }) as StructureStorage[];
    let energyInStorage = 0;
    if (storage.length) {
      energyInStorage = storage[0].store.getUsedCapacity(RESOURCE_ENERGY);
    }
    let partsRequired = 1;
    if (energyInStorage > 300000) {
      partsRequired = 30;
    }
    if (this.idea.rcl === 8) {
      partsRequired = 15;
    }
    return totalParts < partsRequired;
  }
}
