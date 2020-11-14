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
      const target = (this.idea.ideas[IdeaType.METABOLIC] as MetabolicIdea).metabolizeInput(figment);
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    } else {
      const target = (this.idea.ideas[IdeaType.METABOLIC] as MetabolicIdea).metabolizeOutput(figment);
      if (target) {
        figment.addNeuron(NeuronType.TRANSFER, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(figmentType: FigmentType): boolean {
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(CARRY));
    return totalParts < 6;
  }
}
