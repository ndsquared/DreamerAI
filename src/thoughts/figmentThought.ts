/* eslint-disable @typescript-eslint/no-empty-function */
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { Thought } from "./thought";

export enum FigmentThoughtName {
  HARVEST = "Harvest",
  PICKUP = "Pickup",
  WORKER = "Worker"
}

export abstract class FigmentThought extends Thought {
  protected figments: Figment[] = [];
  protected figmentBody = [WORK, CARRY, MOVE];
  protected figmentsNeeded = 0;
  protected figmentPriority = 10;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected figmentInitFunc = (figment: Figment): void => {};
  protected priorityFunc = (): void => {};

  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public addFigment(figment: Figment): void {
    this.figments.push(figment);
  }

  public ponder(): void {
    this.priorityFunc();
    if (this.figmentsNeeded > this.figments.length) {
      const name = Figment.GetUniqueName();
      this.idea.addSpawn(name, this.figmentBody, this.figmentPriority, this.name, this.instance);
    }
    for (const figment of this.figments) {
      if (figment.isDreaming) {
        this.figmentInitFunc(figment);
      }
    }
  }
  public think(): void {
    for (const figment of this.figments) {
      figment.run();
    }
  }
  public reflect(): void {
    this.figments = [];
  }
}
