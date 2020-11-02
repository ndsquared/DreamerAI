import { Idea } from "ideas/idea";

export abstract class Thought implements IBrain {
  protected idea: Idea;
  protected name: string;
  protected instance: number;

  public constructor(idea: Idea, name: string, instance: number) {
    this.idea = idea;
    this.name = name;
    this.instance = instance;
  }

  public abstract ponder(): void;
  public abstract think(): void;
  public abstract reflect(): void;
}
