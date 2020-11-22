import { Idea } from "ideas/idea";

export enum FigmentThoughtType {
  HARVEST = "Harvest",
  PICKUP = "Pickup",
  WORKER = "Worker",
  TRANSFER = "Transfer",
  TOWER_FILLER = "Tower Filler",
  SCOUT = "Scout",
  RESERVE = "Reserve",
  UPGRADE = "Upgrade",
  ATTACK = "Attack",
  DEFENSE = "Defense"
}

export enum BuildThoughtType {
  EXTENSION = "Extension",
  ROAD = "Road",
  CONTAINER = "Container",
  TOWER = "Tower",
  STORAGE = "Storage",
  RAMPART = "Rampart",
  LINK = "Link",
  TERMINAL = "Terminal"
}

export abstract class Thought implements IBrain {
  protected idea: Idea;
  public type: FigmentThoughtType | BuildThoughtType;
  public instance: string;

  public constructor(idea: Idea, type: FigmentThoughtType | BuildThoughtType, instance: string) {
    this.idea = idea;
    this.type = type;
    this.instance = instance;
  }

  public abstract ponder(): void;
  public abstract think(): void;
  public abstract reflect(): void;
}
