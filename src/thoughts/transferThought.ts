import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class TransferThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.TRANSFER] = [];
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      let target = figment.getNextPickupOrWithdrawTargetInRange(10, {
        useStorage: true,
        minCapacity: figment.store.getCapacity(RESOURCE_ENERGY),
        originRoom: figment.room
      });
      if (!target) {
        target = figment.getNextPickupOrWithdrawTarget({
          useStorage: true,
          avoidSpawnContainer: false,
          originRoom: this.idea.spawn.room
        });
      }
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos, { minCapacity: true });
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      }
    } else {
      let target = figment.getNextTransferTarget({
        useStorage: false,
        avoidSpawnContainer: true,
        originRoom: this.idea.spawn.room,
        emptyTarget: true
      });
      if (!target) {
        target = figment.getNextTransferTarget({
          useStorage: false,
          avoidSpawnContainer: true,
          originRoom: this.idea.spawn.room
        });
      }
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(figmentType: FigmentType): boolean {
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(CARRY));
    return totalParts < 4;
  }
}
