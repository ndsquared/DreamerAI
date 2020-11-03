import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentsNeeded = 8;
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [1, 1, 2],
      minParts: 4,
      maxParts: 20
    };
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const target = figment.getNextBuildTarget({ originRoom: this.idea.spawn.room });
      const controller = this.idea.spawn.room.controller;
      if (controller && controller.my) {
        if (target && controller.ticksToDowngrade > 4000) {
          figment.addNeuron(NeuronType.BUILD, target.id, target.pos);
        } else {
          figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
        }
      } else if (target) {
        figment.addNeuron(NeuronType.BUILD, target.id, target.pos);
      }
    } else {
      const target = figment.getNextPickupOrWithdrawTarget({
        useStorage: true,
        avoidControllerStorage: false,
        originRoom: this.idea.spawn.room
      });
      if (target instanceof Resource) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      } else if (target) {
        figment.addNeuron(NeuronType.WITHDRAW, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    if (this.figments.length >= 4) {
      this.figmentPriority = 2;
    }
  }
}
