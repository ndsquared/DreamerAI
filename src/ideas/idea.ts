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
  // Factor out the concept of a parent idea
  public idea: Idea | null = null;
  public ideas: { [type: string]: Idea } = {};
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
  public constructor(spawn: StructureSpawn, imagination: Imagination, type: IdeaType, idea: Idea | null) {
    this.spawn = spawn;
    this.name = spawn.room.name;
    this.imagination = imagination;
    this.type = type;
    this.idea = idea;
  }

  public ponder(): void {
    this.spawn = Game.spawns[this.spawn.name];
    for (const ideaName in this.ideas) {
      const idea = this.ideas[ideaName];
      idea.ponder();
    }
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
    for (const ideaName in this.ideas) {
      const idea = this.ideas[ideaName];
      idea.think();
    }
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
    for (const ideaName in this.ideas) {
      const idea = this.ideas[ideaName];
      idea.reflect();
    }
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
