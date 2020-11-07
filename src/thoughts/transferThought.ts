import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class TransferThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [CARRY],
      ratio: [1],
      minParts: 6,
      maxParts: 24,
      ignoreCarry: false
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      let target = figment.getNextPickupOrWithdrawTargetInRange(10, {
        useStorage: true,
        minCapacity: figment.store.getCapacity(RESOURCE_ENERGY),
        originRoom: figment.room
      });
      if (!target) {
        target = figment.getNextPickupOrWithdrawTarget({ useStorage: true, originRoom: this.idea.spawn.room });
      }
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos, { minCapacity: true });
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      }
    } else {
      let target = figment.getNextTransferTarget({
        useStorage: false,
        originRoom: this.idea.spawn.room,
        emptyTarget: true
      });
      if (!target) {
        target = figment.getNextTransferTarget({
          useStorage: false,
          originRoom: this.idea.spawn.room
        });
      }
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    if (this.figments.length >= 1) {
      this.figmentPriority = 2;
    }
  }
  public setFigmentsNeeded(): void {
    const totalParts = _.sum(this.figments, f => f.getActiveBodyparts(CARRY));
    if (totalParts >= 10) {
      this.figmentsNeeded = 0;
    } else {
      this.figmentsNeeded = this.figments.length + 1;
    }
  }
}
