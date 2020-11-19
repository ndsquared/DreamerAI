import { FigmentThought, FigmentType } from "./figmentThought";
import { Idea, IdeaType } from "ideas/idea";
import { Figment } from "figments/figment";
import { MetabolicIdea } from "ideas/metabolicIdea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class PickupThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.PICKUP] = [];
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() === 0) {
      const target = (this.idea.imagination.ideas[this.idea.name][
        IdeaType.METABOLIC
      ] as MetabolicIdea).metabolizeOutput(figment);
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    } else {
      const target = (this.idea.imagination.ideas[this.idea.name][IdeaType.METABOLIC] as MetabolicIdea).metabolizeInput(
        figment
      );
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      } else if (!figment.pos.inRangeTo(this.idea.spawn.pos, 3)) {
        figment.addNeuron(NeuronType.MOVE, "", this.idea.spawn.pos, { moveRange: 3 });
      }
    }
  }

  public figmentNeeded(): boolean {
    // This should calculated in the Genesis Idea
    return false;
  }
}
