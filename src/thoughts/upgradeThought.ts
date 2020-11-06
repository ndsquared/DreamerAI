import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class UpgradeThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, MOVE, CARRY],
      ratio: [2, 1, 1],
      minParts: 4,
      maxParts: 15
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
    this.figmentsNeeded = 3;
    for (const room of this.idea.spawn.room.neighborhood) {
      const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
      if (constructionSites.length) {
        this.figmentPriority = 1;
        return;
      }
    }
  }
}
