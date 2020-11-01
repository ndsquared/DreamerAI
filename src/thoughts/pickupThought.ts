import { Idea } from "ideas/idea";
import { Thought } from "./thought";

export class PickupThought extends Thought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 2;
    this.figmentBody = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    this.figmentInitFunc = figment => {
      figment.assignPickupNeuron();
    };
    this.priorityFunc = () => {
      if (this.figments.length >= 1) {
        this.figmentPriority = 2;
      }
    };
  }
}
