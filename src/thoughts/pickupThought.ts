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
    this.figmentsNeeded = 1;
    this.figmentBodySpec = {
      bodyParts: [MOVE, CARRY],
      ratio: [1, 1],
      minParts: 6,
      maxParts: 30
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      if (!figment.pos.inRangeTo(this.sourcePos, 4)) {
        figment.addNeuron(NeuronType.MOVE, "", this.sourcePos, { moveRange: 3 });
        return;
      }
      let target = figment.getNextPickupOrWithdrawTarget({ originRoom: figment.room });
      if (!target) {
        target = figment.getNextPickupOrWithdrawTargetNeighborhood({ originRoom: this.idea.spawn.room });
      }
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos, { minCapacity: true });
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos, { minCapacity: true });
      }
    } else {
      const target = figment.getNextTransferTargetNeighborhood({ originRoom: this.idea.spawn.room });
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentPriority = 4;
    if (this.name === FigmentThoughtName.REMOTE_PICKUP) {
      this.figmentPriority = 2;
    }
  }
}
