import { Hippocampus } from "temporal/hippocampus";
import { Imagination } from "imagination";
import { Thought } from "thoughts/thought";

export interface ThoughtMapping {
  name: string;
  thought: any;
}

export enum IdeaType {
  TABULA_RASA = "Tabula Rasa",
  GENESIS = "Genesis",
  CREATION = "Creation"
}

export abstract class Idea implements IBrain {
  public roomName: string;
  public thoughts: { [type: string]: { [instance: string]: Thought } } = {};
  public imagination: Imagination;
  public type: IdeaType;
  public showStats = true;
  public showBuildVisuals = true;
  public showMetaVisuals = true;
  public showEnemyVisuals = true;
  public constructor(roomName: string, imagination: Imagination, type: IdeaType) {
    this.roomName = roomName;
    this.imagination = imagination;
    this.type = type;
  }

  public get hippocampus(): Hippocampus {
    return this.imagination.hippocampus;
  }

  public get room(): Room | undefined {
    return Game.rooms[this.roomName];
  }

  public get rcl(): number {
    const room = this.room;
    if (room) {
      return room.controller?.level === undefined ? 0 : room.controller.level;
    }
    console.log(`unable to attain rcl for idea ${this.type}`);
    return 0;
  }

  public ponder(): void {
    for (const thoughtName in this.thoughts) {
      for (const thoughtInstance in this.thoughts[thoughtName]) {
        const thought = this.thoughts[thoughtName][thoughtInstance];
        try {
          thought.ponder();
        } catch (error) {
          console.log(`${thought.type} error while pondering`);
          console.log(error);
        }
      }
    }
  }

  public think(): void {
    for (const thoughtName in this.thoughts) {
      for (const thoughtInstance in this.thoughts[thoughtName]) {
        const thought = this.thoughts[thoughtName][thoughtInstance];
        try {
          thought.think();
        } catch (error) {
          console.log(`${thought.type} error while thinking`);
          console.log(error);
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
          console.log(`${thought.type} error while reflecting`);
          console.log(error);
        }
      }
    }
  }
}
