import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class UpgradeThought extends FigmentThought {
  private controller: StructureController | undefined = undefined;
  private container: StructureContainer | null = null;
  private storage: StructureStorage | null = null;
  private link: StructureLink | null = null;
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.UPGRADE] = [];
  }

  private getNextWithdrawTarget(): StoreStructure | null {
    if (this.link) {
      return this.link;
    } else if (this.container) {
      return this.container;
    } else if (this.storage) {
      return this.storage;
    }
    const room = this.idea.room;
    if (room) {
      return this.idea.hippocampus.getNextAvailableSpawn(room.name);
    }
    return null;
  }

  public ponder(): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    this.controller = room.controller;
    if (!this.container) {
      if (this.controller && this.controller.my) {
        if (this.idea.hippocampus.controllerContainers.length) {
          this.container = this.idea.hippocampus.controllerContainers[0];
        }
      }
    } else {
      this.container = Game.getObjectById(this.container.id);
    }
    if (!this.storage) {
      if (room.storage) {
        this.storage = room.storage;
      }
    } else {
      this.storage = Game.getObjectById(this.storage.id);
    }
    if (!this.link) {
      if (this.controller && this.controller.my) {
        if (this.idea.hippocampus.controllerLinks.length > 0) {
          this.link = this.idea.hippocampus.controllerLinks[0];
        }
      }
    } else {
      this.link = Game.getObjectById(this.link.id);
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
      if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
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
    if (energyInStorage > 300000 && this.figments[figmentType].length < 3) {
      return true;
    } else if (!this.storage && energyInContainer === 2000 && this.figments[figmentType].length < 2) {
      return true;
    }
    if (this.idea.rcl === 8) {
      partsRequired = 15;
    }
    return totalParts < partsRequired;
  }
}
