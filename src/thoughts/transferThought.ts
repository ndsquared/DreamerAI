import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class TransferThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [MOVE, CARRY],
      ratio: [1, 1],
      minParts: 6,
      maxParts: 20
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      const target = figment.getNextPickupOrWithdrawTarget(true);
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    } else {
      const target = figment.getNextTransferTarget(false);
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentPriority = 6;
    const storage = this.idea.spawn.room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_STORAGE });
    if (storage.length) {
      this.figmentsNeeded = 1;
    } else {
      this.figmentsNeeded = 0;
    }
  }
}
