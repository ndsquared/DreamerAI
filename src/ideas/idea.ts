import { Imagination } from "imagination";
import { Thought } from "thoughts/thought";

export interface ThoughtMapping {
  name: string;
  thought: any;
}

export enum IdeaType {
  TABULA_RASA = "Tabula Rasa",
  GENESIS = "Genesis",
  CREATION = "Creation",
  COMBAT = "Combat",
  METABOLIC = "Metabolic"
}

export abstract class Idea implements IBrain {
  public name: string;
  public thoughts: { [type: string]: { [instance: string]: Thought } } = {};
  public spawn: StructureSpawn;
  public imagination: Imagination;
  public type: IdeaType;
  public rcl = 0;
  public showStats = true;
  public showBuildVisuals = true;
  public showMetaVisuals = true;
  public showEnemyVisuals = true;
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType) {
    this.spawn = spawn;
    this.name = spawn.room.name;
    this.imagination = imagination;
    this.type = type;
  }

  public ponder(): void {
    this.spawn = Game.spawns[this.spawn.name];
    for (const thoughtName in this.thoughts) {
      for (const thoughtInstance in this.thoughts[thoughtName]) {
        const thought = this.thoughts[thoughtName][thoughtInstance];
        try {
          thought.ponder();
        } catch (error) {
          console.log(`${thought.name} error while pondering`);
        }
      }
    }
    this.rcl = this.spawn.room.controller?.level === undefined ? 0 : this.spawn.room.controller.level;
  }

  public think(): void {
    for (const thoughtName in this.thoughts) {
      for (const thoughtInstance in this.thoughts[thoughtName]) {
        const thought = this.thoughts[thoughtName][thoughtInstance];
        try {
          thought.think();
        } catch (error) {
          console.log(`${thought.name} error while thinking`);
        }
      }
    }
  }

  public reflect(): void {
    for (const thoughtName in this.thoughts) {
      for (const thoughtInstance in this.thoughts[thoughtName]) {
        const thought = this.thoughts[thoughtName][thoughtInstance];
        try {
          thought.reflect();
        } catch (error) {
          console.log(`${thought.name} error while reflecting`);
        }
      }
    }
  }
}
