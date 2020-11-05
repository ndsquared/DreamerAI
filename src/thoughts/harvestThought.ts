import { FigmentThought, FigmentThoughtName } from "./figmentThought";
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class HarvestThought extends FigmentThought {
  private source: Source | null;
  private sourceId: Id<Source>;
  private sourcePos: RoomPosition;
  public constructor(idea: Idea, name: string, source: Source) {
    super(idea, name, source.id);
    this.source = source;
    this.sourceId = source.id;
    this.sourcePos = source.pos;
    this.figmentBodySpec = {
      bodyParts: [WORK, MOVE, CARRY],
      ratio: [2, 1, 1],
      minParts: 4,
      maxParts: 10
    };
  }

  public ponder(): void {
    this.source = Game.getObjectById(this.sourceId);

    const totalWorkParts = _.sum(this.figments, f => f.getActiveBodyparts(WORK));
    if (totalWorkParts >= 5) {
      this.figmentsNeeded = 0;
    } else if (this.source && this.figments.length < this.source.pos.availableNeighbors(true).length) {
      this.figmentsNeeded = this.figments.length + 1;
    }

    super.ponder();
  }

  public handleFigment(figment: Figment): void {
    if (!this.source) {
      figment.addNeuron(NeuronType.MOVE, "", this.sourcePos);
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
      if (containers[0].pos.isEqualTo(figment.pos)) {
        shouldDropHarvest = true;
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
      if (this.name === FigmentThoughtName.REMOTE_HARVEST) {
        shouldDropHarvest = this.idea.getFigmentCount(FigmentThoughtName.REMOTE_PICKUP) > 0;
      }
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
      const target = figment.getNextTransferTargetNeighborhood({ originRoom: this.idea.spawn.room });
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    const count = this.idea.getFigmentCount(FigmentThoughtName.HARVEST);
    if (count > 6) {
      this.figmentPriority = 3;
    } else if (count > 2) {
      this.figmentPriority = 8;
    } else {
      this.figmentPriority = 12;
    }
    if (this.name === FigmentThoughtName.REMOTE_HARVEST) {
      this.figmentPriority = 2;
    }
  }
}
