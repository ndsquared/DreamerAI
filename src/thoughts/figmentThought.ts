import { FigmentThoughtType, Thought } from "./thought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import profiler from "screeps-profiler";

export abstract class FigmentThought extends Thought {
  public figments: { [type: string]: Figment[] } = {};

  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
  }

  public addFigment(figment: Figment): void {
    const type = figment.memory.figmentType;
    if (this.figments[type]) {
      this.figments[type].push(figment);
    } else {
      this.figments[type] = [figment];
    }
  }

  public ponder(): void {
    // Placeholder
  }

  public think(): void {
    for (const figmentType in this.figments) {
      for (const figment of this.figments[figmentType]) {
        if (figment.isDreaming) {
          this.handleFigment(figment);
        }
        const tookAction = figment.run();
        // If we didn't take any action this turn, try to take the next action
        if (!tookAction) {
          this.handleFigment(figment);
          figment.run();
        }
      }
    }
  }

  public reflect(): void {
    for (const figmentType in this.figments) {
      this.figments[figmentType] = [];
    }
  }

  public abstract handleFigment(figment: Figment): void;
  public abstract figmentNeeded(figmentType: string): boolean;
}

profiler.registerClass(FigmentThought, "FigmentThought");
