import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class UpgradeThought extends FigmentThought {
  private controller: StructureController | undefined = undefined;
  private container: StructureContainer | null = null;
  private storage: StructureStorage | null = null;
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

  public ponder(): void {
    this.controller = this.idea.spawn.room.controller;
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
    let energyInContainer = 0;
    if (this.container) {
      energyInContainer = this.container.store.getUsedCapacity(RESOURCE_ENERGY);
    }
    let energyInStorage = 0;
    if (this.storage) {
      energyInStorage = this.storage.store.getUsedCapacity(RESOURCE_ENERGY);
    }
    let partsRequired = 1;
    if (energyInStorage > 300000 && this.figments[figmentType].length < 5) {
      return true;
    } else if (energyInContainer > 2000 && this.figments[figmentType].length < 3) {
      return true;
    }
    if (this.idea.rcl === 8) {
      partsRequired = 15;
    }
    return totalParts < partsRequired;
  }
}
