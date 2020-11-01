import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 12;
    this.figmentBody = [WORK, CARRY, MOVE, MOVE];
  }

  public handleFigment(figment: Figment): void {
    if (figment.store.getUsedCapacity() > 0) {
      const target = figment.getNextConstructionSite();
      if (target) {
        figment.addNeuron(NeuronType.BUILD, target.id, target.pos);
      } else {
        if (figment.room.controller && figment.room.controller.my) {
          const controller = figment.room.controller;
          figment.addNeuron(NeuronType.UPGRADE, controller.id, controller.pos);
        }
      }
    } else {
      const target = figment.getNearestResource();
      if (target) {
        figment.addNeuron(NeuronType.PICKUP, target.id, target.pos);
      }
    }
  }

  public adjustPriority(): void {
    if (this.figments.length >= 4) {
      this.figmentPriority = 2;
    }
  }
}
