import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class RepairThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 1;
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [1, 1, 2],
      minParts: 4,
      maxParts: 20
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const repairTarget = figment.getNextRepairTarget();
      if (repairTarget) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else {
        const buildTarget = figment.getNextBuildTarget();
        const controller = figment.room.controller;
        if (buildTarget && controller && controller.my && controller.ticksToDowngrade > 4000) {
          figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
        } else {
          if (controller && controller.my) {
            figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
          }
        }
      }
    } else {
      const target = figment.getNextPickupOrWithdrawTarget();
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentPriority = 1;
  }
}
