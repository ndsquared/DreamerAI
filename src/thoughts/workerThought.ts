import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";

export class WorkerThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 10;
    this.figmentBody = [WORK, CARRY, MOVE, MOVE];
    this.figmentInitFunc = figment => {
      figment.assignWorkerNeuron();
    };
    this.priorityFunc = () => {
      if (this.figments.length >= 4) {
        this.figmentPriority = 2;
      }
    };
  }
}
