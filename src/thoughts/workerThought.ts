import { FigmentThought, FigmentType } from "./figmentThought";
import { PathFindWithRoad, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.WORKER] = [];
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const repairTarget = this.idea.hippocampus.getNextRepairTarget();
      const buildTarget = this.idea.hippocampus.getNextConstructionSite();
      const controller = this.idea.spawn.room.controller;
      if (
        repairTarget &&
        buildTarget &&
        PathFindWithRoad(figment.pos, repairTarget.pos).cost < PathFindWithRoad(figment.pos, buildTarget.pos).cost
      ) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else if (buildTarget) {
        figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
        figment.addNeuron(NeuronType.SLEEP, "", null, { sleepTicks: 2 });
      } else if (repairTarget) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else if (controller && controller.my) {
        figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
      }
    } else {
      const target = this.idea.hippocampus.metabolizeClosestResourceOrStructure(figment);
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public figmentNeeded(): boolean {
    // This should be calculated in the genesis idea
    return false;
  }
}
