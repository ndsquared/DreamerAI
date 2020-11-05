import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { isStoreStructure } from "utils/misc";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [1, 1, 1],
      minParts: 4,
      maxParts: 15
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const repairTarget = figment.getNextRepairTargetNeighborhood({ originRoom: this.idea.spawn.room });
      if (repairTarget) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else {
        const buildTarget = figment.getNextBuildTargetNeighborhood({ originRoom: this.idea.spawn.room });
        const controller = this.idea.spawn.room.controller;
        if (controller && controller.my) {
          if (buildTarget && controller.ticksToDowngrade > 4000) {
            figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
          } else {
            figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
          }
        }
      }
    } else {
      const target = figment.getNextPickupOrWithdrawTargetNeighborhood({
        useStorage: true,
        originRoom: this.idea.spawn.room,
        avoidControllerStorage: false
      });
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target && isStoreStructure(target)) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentPriority = 2;
    this.figmentsNeeded = 2;
    for (const room of this.idea.spawn.room.neighborhood) {
      if (this.idea.shouldBuild[room.name]) {
        this.figmentsNeeded = 5;
        this.figmentPriority = 3;
        return;
      }
    }
  }
}
