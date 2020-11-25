import { PathFindWithRoad, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "./thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.WORKER] = [];
  }

  public handleFigment(figment: Figment): boolean {
    const room = this.idea.room;
    if (!room) {
      return false;
    }
    if (figment.store.getUsedCapacity() > 0) {
      const repairTarget = this.idea.cortex.getNextRepairTarget(room.name);
      const buildTarget = this.idea.cortex.getNextConstructionSite(room.name);
      const controller = room.controller;
      if (
        repairTarget &&
        buildTarget &&
        PathFindWithRoad(figment.pos, repairTarget.pos).cost < PathFindWithRoad(figment.pos, buildTarget.pos).cost
      ) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else if (buildTarget) {
        figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
        figment.addNeuron(NeuronType.SLEEP, "", undefined, { sleepTicks: 2 });
      } else if (repairTarget) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else if (controller && controller.my) {
        figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
      }
    } else {
      const target = this.idea.metabolism.metabolizeClosestResourceOrStructure(figment);
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
    return true;
  }

  public figmentNeeded(): boolean {
    // This should be calculated in the genesis idea
    return false;
  }
}
