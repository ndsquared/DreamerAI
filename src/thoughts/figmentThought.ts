import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { Thought } from "./thought";

export enum FigmentThoughtName {
  HARVEST = "Harvest",
  PICKUP = "Pickup",
  WORKER = "Worker",
  REPAIR = "Repair",
  TRANSFER = "Transfer",
  SCOUT = "Scout"
}

export abstract class FigmentThought extends Thought {
  protected figments: Figment[] = [];
  protected figmentsNeeded = 0;
  protected figmentPriority = 10;
  protected figmentBodySpec: FigmentBodySpec;

  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY, MOVE],
      ratio: [1, 1, 1],
      minParts: 3,
      maxParts: 20
    };
  }

  public addFigment(figment: Figment): void {
    this.figments.push(figment);
  }

  public ponder(): void {
    this.adjustPriority();
    if (this.figmentsNeeded > this.figments.length) {
      const name = Figment.GetUniqueName();
      this.idea.addSpawn(name, this.figmentBodySpec, this.figmentPriority, this.name, this.instance);
    }
    for (const figment of this.figments) {
      if (figment.isDreaming) {
        this.handleFigment(figment);
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

  public abstract handleFigment(figment: Figment): void;
  public abstract adjustPriority(): void;
}
