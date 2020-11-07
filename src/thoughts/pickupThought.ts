import { FigmentThought, FigmentThoughtName } from "./figmentThought";
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class PickupThought extends FigmentThought {
  private sourcePos: RoomPosition;
  public constructor(idea: Idea, name: string, source: Source) {
    super(idea, name, source.id);
    this.sourcePos = source.pos;
    this.figmentBodySpec = {
      bodyParts: [CARRY],
      ratio: [1],
      minParts: 6,
      maxParts: 30,
      ignoreCarry: false
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      if (!figment.pos.inRangeTo(this.sourcePos, 4)) {
        figment.addNeuron(NeuronType.MOVE, "", this.sourcePos, { moveRange: 3 });
        return;
      }
      let target = figment.getNextPickupOrWithdrawTargetInRange(10, {
        minCapacity: figment.store.getCapacity(RESOURCE_ENERGY),
        originRoom: figment.room
      });
      // if (target) console.log(`pickup target ${target.pos.toString()}`);
      if (!target) {
        target = figment.getNextPickupOrWithdrawTargetNeighborhood({ originRoom: this.idea.spawn.room });
      }
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    } else {
      const target = figment.getNextTransferTargetNeighborhood({ originRoom: this.idea.spawn.room });
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentPriority = 3;
    if (this.name === FigmentThoughtName.REMOTE_PICKUP) {
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
