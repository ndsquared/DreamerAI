import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class PickupThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 2;
    this.figmentBodySpec = {
      bodyParts: [CARRY, MOVE],
      ratio: [1, 1],
      minParts: 6,
      maxParts: 20
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      const target = figment.getNearestResource();
      if (target) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      }
    } else {
      const target = figment.getNextTransferTarget();
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    if (this.figments.length >= 1) {
      this.figmentPriority = 4;
    }
  }
}
