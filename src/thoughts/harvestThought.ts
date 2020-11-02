import { FigmentThought, FigmentThoughtName } from "./figmentThought";
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  public constructor(idea: Idea, name: string, instance: number, source: Source) {
    super(idea, name, instance);
    this.source = source;
    if (this.idea.getFigmentCount(FigmentThoughtName.HARVEST) < 6) {
      this.figmentsNeeded = source.pos.availableNeighbors(true).length;
    }
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [2, 1, 1],
      minParts: 4,
      maxParts: 20
    };
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
    } else if (this.source.energy === 0) {
      if (figment.store.getUsedCapacity() > 0) {
        figment.addNeuron(NeuronType.DROP);
      }
      return;
    }
    const shouldDropHarvest = this.idea.getFigmentCount(FigmentThoughtName.PICKUP) > 0;
    let targetOptions = null;
    if (shouldDropHarvest) {
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
    const count = this.idea.getFigmentCount(FigmentThoughtName.HARVEST);
    if (count > 6) {
      this.figmentPriority = 1;
    } else if (count > 2) {
      this.figmentPriority = 8;
    } else {
      this.figmentPriority = 12;
    }
  }
}
