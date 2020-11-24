import { Cortex } from "temporal/cortex";
import { Imagination } from "imagination";
import { Metabolism } from "temporal/metabolism";
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

  public get cortex(): Cortex {
    return this.imagination.cortex;
  }

  public get metabolism(): Metabolism {
    return this.imagination.cortex.metabolism;
  }

  public get room(): Room | undefined {
    return Game.rooms[this.roomName];
  }

  public get figmentCount(): Record<string, number> {
    return this.cortex.cerebellum.genesisMemory(this.roomName).figmentCount;
  }

  public get figmentPrefs(): FigmentPreferences {
    return this.cortex.hippocampus.figmentPreferences[this.roomName];
  }

  public get territory(): TerritoryObjects {
    return this.cortex.hippocampus.territory;
  }

  public get neighborhood(): NeighborhoodObjects {
    return this.cortex.hippocampus.neighborhood[this.roomName];
  }

  public get baseRoomObjects(): BaseRoomObjects {
    return this.cortex.hippocampus.baseRoomObjects[this.roomName];
  }

  public get roomObjects(): HippocampusRoomObjects {
    return this.cortex.hippocampus.roomObjects[this.roomName];
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
