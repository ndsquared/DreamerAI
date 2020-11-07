import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { Thought } from "./thought";
import profiler from "screeps-profiler";

export enum FigmentThoughtName {
  HARVEST = "Harvest",
  PICKUP = "Pickup",
  WORKER = "Worker",
  REPAIR = "Repair",
  TRANSFER = "Transfer",
  SCOUT = "Scout",
  REMOTE_HARVEST = "Remote Harvest",
  REMOTE_PICKUP = "Remote Pickup",
  RESERVE = "Reserve",
  UPGRADE = "Upgrade",
  ATTACK = "Attack",
  DEFENSE = "Defense"
}

export abstract class FigmentThought extends Thought {
  protected figments: Figment[] = [];
  protected figmentsNeeded = 0;
  protected figmentPriority = 10;
  protected figmentBodySpec: FigmentBodySpec;

  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY],
      ratio: [1, 1],
      minParts: 3,
      maxParts: 20,
      ignoreCarry: false
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

profiler.registerClass(FigmentThought, "FigmentThought");
