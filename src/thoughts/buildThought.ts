/* eslint-disable @typescript-eslint/no-empty-function */
import { Idea } from "ideas/idea";
import { Thought } from "./thought";

export abstract class BuildThought extends Thought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
  }

  public abstract ponder(): void;
  public abstract think(): void;
  public abstract reflect(): void;
}
