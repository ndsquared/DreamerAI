import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class RepairThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [1, 1, 2],
      minParts: 4,
      maxParts: 20
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const repairTarget = figment.getNextRepairTarget({ originRoom: this.idea.spawn.room });
      if (repairTarget) {
        figment.addNeuron(NeuronType.REPAIR, repairTarget.id, repairTarget.pos);
      } else {
        const buildTarget = figment.getNextBuildTarget({ originRoom: this.idea.spawn.room });
        const controller = this.idea.spawn.room.controller;
        if (controller && controller.my) {
          if (buildTarget && controller.ticksToDowngrade > 4000) {
            figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
          } else {
            figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
          }
        } else if (buildTarget) {
          figment.addNeuron(NeuronType.BUILD, buildTarget.id, buildTarget.pos);
        }
      }
    } else {
      const target = figment.getNextPickupOrWithdrawTarget({ useStorage: true, originRoom: this.idea.spawn.room });
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    this.figmentPriority = 1;
    if (this.idea.rcl > 3) {
      this.figmentsNeeded = 2;
    } else {
      this.figmentsNeeded = 1;
    }
  }
}
