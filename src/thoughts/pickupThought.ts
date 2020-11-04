import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class PickupThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
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
      const target = figment.getNextPickupOrWithdrawTarget({ originRoom: this.idea.spawn.room });
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos, { minCapacity: true });
      } else if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      }
    } else {
      const target = figment.getNextTransferTarget({ originRoom: this.idea.spawn.room });
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    if (this.figments.length >= 1) {
      this.figmentPriority = 4;
    }
    const neighborRooms = this.idea.spawn.room.neighbors;
    if (neighborRooms.length > 1) {
      this.figmentsNeeded = 6;
    } else if (neighborRooms.length === 1) {
      this.figmentsNeeded = 3;
    } else {
      this.figmentsNeeded = 2;
    }
  }
}
