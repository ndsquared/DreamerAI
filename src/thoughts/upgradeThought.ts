import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class UpgradeThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [CARRY, WORK],
      ratio: [1, 3],
      minParts: 4,
      maxParts: 21,
      ignoreCarry: true,
      roadTravel: true
    };
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

  public adjustPriority(): void {
    this.figmentPriority = 3;
    for (const room of this.idea.spawn.room.neighborhood) {
      const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
      if (constructionSites.length) {
        this.figmentPriority = 1;
        return;
      }
    }
  }
  public setFigmentsNeeded(): void {
    const totalParts = _.sum(this.figments, f => f.getActiveBodyparts(WORK));
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
    let partsRequired = 10;
    if (energyInStorage > 300000) {
      partsRequired = 30;
    }
    if (this.idea.rcl === 8) {
      partsRequired = 15;
    }
    if (totalParts >= partsRequired) {
      this.figmentsNeeded = 0;
    } else {
      this.figmentsNeeded = this.figments.length + 1;
    }
  }
}
