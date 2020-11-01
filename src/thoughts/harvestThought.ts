import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  public constructor(idea: Idea, name: string, instance: number, source: Source) {
    super(idea, name, instance);
    this.source = source;
    this.figmentsNeeded = source.pos.availableNeighbors(true).length;
    this.figmentBody = [WORK, WORK, CARRY, MOVE];
  }

  public ponder(): void {
    if (this.source) {
      this.source = Game.getObjectById(this.source.id);
    }
    super.ponder();
  }

  public handleFigment(figment: Figment): void {
    if (!this.source) {
      return;
    }
    const shouldDrop = this.figments.length > 1;
    let targetOptions = null;
    if (shouldDrop) {
      targetOptions = {
        ignoreFigmentCapacity: true
      };
    }
    if (figment.store.getUsedCapacity() === 0) {
      figment.addNeuron(NeuronType.HARVEST, this.source.id, this.source.pos, targetOptions);
    } else {
      const target = figment.getNextTransferTarget();
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    if (this.figments.length > 1) {
      this.figmentPriority = 8;
    } else {
      this.figmentPriority = 12;
    }
  }
}
