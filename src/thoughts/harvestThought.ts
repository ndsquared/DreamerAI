import { FigmentThought, FigmentThoughtName } from "./figmentThought";
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  public constructor(idea: Idea, name: string, instance: number, source: Source) {
    super(idea, name, instance);
    this.source = source;
    this.figmentBodySpec = {
      bodyParts: [WORK, MOVE, CARRY],
      ratio: [2, 1, 1],
      minParts: 4,
      maxParts: 10
    };
  }

  public ponder(): void {
    const totalWorkParts = _.sum(this.figments, f => f.getActiveBodyparts(WORK));
    if (totalWorkParts >= 5) {
      this.figmentsNeeded = 0;
    } else if (this.source) {
      this.figmentsNeeded = this.figments.length + 1;
    }

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

    const containers = this.source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });

    let shouldDropHarvest = false;
    if (containers.length > 0) {
      // console.log(`Found container near source ${this.source.id}`);
      if (containers[0].pos.isEqualTo(figment.pos)) {
        shouldDropHarvest = true;
        // console.log(`${figment.name} is drop harvesting`);
      } else {
        const figments = containers[0].pos.lookFor(LOOK_CREEPS);
        if (figments.length === 0) {
          figment.addNeuron(NeuronType.MOVE, containers[0].id, containers[0].pos);
          return;
        } else {
          shouldDropHarvest = true;
        }
      }
    } else {
      shouldDropHarvest = this.idea.getFigmentCount(FigmentThoughtName.PICKUP) > 0;
    }

    let targetOptions = null;
    if (shouldDropHarvest) {
      targetOptions = {
        ignoreFigmentCapacity: true
      };
    }

    if (figment.store.getUsedCapacity() === 0) {
      figment.addNeuron(NeuronType.HARVEST, this.source.id, this.source.pos, targetOptions);
    } else {
      const target = figment.getNextTransferTarget({ originRoom: this.idea.spawn.room });
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
