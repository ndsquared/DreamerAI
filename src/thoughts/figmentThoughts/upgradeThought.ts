import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class UpgradeThought extends FigmentThought {
  private controllerId: Id<StructureController> | undefined = undefined;
  private containerId: Id<StructureContainer> | undefined = undefined;
  private storageId: Id<StructureStorage> | undefined = undefined;
  private linkId: Id<StructureLink> | undefined = undefined;
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.UPGRADE] = [];
  }

  public get controller(): StructureController | null {
    if (this.controllerId) {
      return Game.getObjectById(this.controllerId);
    }
    this.containerId = undefined;
    return null;
  }

  public get container(): StructureContainer | null {
    if (this.containerId) {
      return Game.getObjectById(this.containerId);
    }
    this.containerId = undefined;
    return null;
  }

  public get link(): StructureLink | null {
    if (this.linkId) {
      return Game.getObjectById(this.linkId);
    }
    this.linkId = undefined;
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
    if (this.link) {
      return this.link;
    } else if (this.container) {
      return this.container;
    } else if (this.storage) {
      return this.storage;
    }
    const room = this.idea.room;
    if (room) {
      return this.idea.cortex.getNextAvailableSpawn(room.name);
    }
    return undefined;
  }

  public ponder(): void {
    const room = this.idea.room;
    if (!room) {
      return;
    }
    if (!this.controller) {
      if (this.idea.baseRoomObjects.controller) {
        this.controllerId = this.idea.baseRoomObjects.controller.id;
      }
    }
    if (!this.container) {
      if (this.idea.baseRoomObjects.controllerContainers.length) {
        this.containerId = this.idea.baseRoomObjects.controllerContainers[0].id;
      }
    }
    if (!this.storage) {
      if (room.storage) {
        this.storageId = room.storage.id;
      }
    }
    if (!this.link) {
      if (this.controller && this.controller.my) {
        if (this.idea.baseRoomObjects.controllerLinks.length > 0) {
          this.linkId = this.idea.baseRoomObjects.controllerLinks[0].id;
        }
      }
    }
    super.ponder();
  }

  public handleFigment(figment: Figment): boolean {
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
    return true;
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
