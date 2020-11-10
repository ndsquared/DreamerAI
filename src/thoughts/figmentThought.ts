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
  protected figmentCombatReady = false;
  private reset = true;

  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentBodySpec = {
      bodyParts: [WORK, CARRY],
      ratio: [1, 1],
      minParts: 3,
      maxParts: 20,
      ignoreCarry: false,
      roadTravel: false
    };
  }

  public addFigment(figment: Figment): void {
    this.figments.push(figment);
  }

  public ponder(): void {
    this.adjustPriority();
    if (this.reset) {
      this.reset = false;
    } else {
      this.setFigmentsNeeded();
      // if (this.figmentsNeeded > 0) {
      //   console.log(`${this.name}:${this.instance} (${this.figments.length}/${this.figmentsNeeded})`);
      // }
    }
    if (this.figmentsNeeded > this.figments.length) {
      const name = Figment.GetUniqueName();
      const payload = {
        name,
        bodySpec: this.figmentBodySpec,
        priority: this.figmentPriority,
        thoughtName: this.name,
        thoughtInstance: this.instance,
        combatReady: this.figmentCombatReady
      };
      this.idea.addSpawn(payload);
    }
    for (const figment of this.figments) {
      if (figment.isDreaming) {
        this.handleFigment(figment);
      }
    }
  }

  public think(): void {
    for (const figment of this.figments) {
      const tookAction = figment.run();
      // If we didn't take any action this turn, try to take the next action
      if (!tookAction) {
        this.handleFigment(figment);
        figment.run();
      }
    }
  }

  public reflect(): void {
    this.figments = [];
  }

  public abstract handleFigment(figment: Figment): void;
  public abstract adjustPriority(): void;
  public abstract setFigmentsNeeded(): void;
}

profiler.registerClass(FigmentThought, "FigmentThought");
