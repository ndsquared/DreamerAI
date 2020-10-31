import { Idea } from "ideas/idea";
import { Figment } from "figment";

export enum ThoughtName {
  HARVEST = "Harvest"
}

export abstract class Thought implements IBrain {
  protected idea: Idea;
  protected name: string;
  protected instance: number;
  protected figments: Figment[] = [];
  protected figmentBody = [WORK, CARRY, MOVE];
  protected figmentsNeeded = 0;
  protected figmentPriority = 1;
  protected figmentInitFunc = (figment: Figment) => {};

  constructor(idea: Idea, name: string, instance: number) {
    this.idea = idea;
    this.name = name;
    this.instance = instance;
  }

  addFigment(figment: Figment) {
    this.figments.push(figment);
  }

  ponder() {
    if (this.figmentsNeeded > this.figments.length) {
      const name = Figment.GetUniqueName();
      this.idea.addSpawn(name, this.figmentBody, this.figmentPriority, this.name, this.instance);
    }
    for (let figment of this.figments) {
      if (figment.isDreaming) {
        // console.log(`dreaming -> ${figment.name}`);
        this.figmentInitFunc(figment);
      }
    }
  }
  think() {
    for (let figment of this.figments) {
      // console.log(`running -> ${figment.name}`);
      figment.run();
    }
  }
  reflect() {
    this.figments = [];
  }
}
