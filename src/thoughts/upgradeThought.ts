import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class UpgradeThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.UPGRADE] = [];
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const controller = this.idea.spawn.room.controller;
      if (controller && controller.my) {
        figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
      }
    } else {
      const target = figment.getNextPickupOrWithdrawTargetNeighborhood({
        useStorage: true,
        originRoom: this.idea.spawn.room,
        avoidControllerContainer: false,
        avoidSpawnContainer: false
      });
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(figmentType: FigmentType): boolean {
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
    let partsRequired = 4;
    if (energyInStorage > 300000) {
      partsRequired = 30;
    }
    if (this.idea.rcl === 8) {
      partsRequired = 15;
    }
    return totalParts < partsRequired;
  }
}
