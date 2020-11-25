import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class PickupThought extends FigmentThought {
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.PICKUP] = [];
  }

  public handleFigment(figment: Figment): boolean {
    const room = this.idea.room;
    if (!room) {
      return false;
    }
    if (figment.store.getUsedCapacity() === 0) {
      const target = this.idea.metabolism.metabolizeOutput(figment);
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    } else {
      const target = this.idea.metabolism.metabolizeInput(figment);
      const baseOriginPos = this.idea.cortex.getBaseOriginPos(room.name);
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      } else if (!figment.pos.inRangeTo(baseOriginPos, 3)) {
        figment.addNeuron(NeuronType.MOVE, "", baseOriginPos, { moveRange: 3 });
      }
    }
    return true;
  }

  public figmentNeeded(): boolean {
    // This should calculated in the Genesis Idea
    return false;
  }
}
