/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType } from "ideas/idea";
import { Hippocampus } from "temporal/hippocampus";
import { TabulaRasaIdea } from "ideas/tabulaRasaIdea";
import { getUsername } from "utils/misc";
import profiler from "screeps-profiler";

export class Imagination implements IBrain {
  public username: string;
  public ideas: { [name: string]: { [name: string]: Idea } };
  public hippocampus: Hippocampus;

  public constructor() {
    console.log("Global reset...");
    this.username = getUsername();
    this.ideas = {};
    this.hippocampus = new Hippocampus(this);
    this.forget();
    this.fantasize();
  }

  private fantasize() {
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      // TODO: need to handle multiple spawns better
      if (!this.ideas[spawn.room.name]) {
        this.ideas[spawn.room.name] = {};
        this.ideas[spawn.room.name][IdeaType.TABULA_RASA] = new TabulaRasaIdea(spawn, this, IdeaType.TABULA_RASA);
        this.hippocampus.addBaseRoomName(spawn.room.name);
      }
    }
  }

  public imagine(): void {
    // CPU guard
    if (Game.cpu.bucket < 200) {
      console.log(`Not enough CPU in bucket to run! | Bucket: ${Game.cpu.bucket}`);
      return;
    }
    // Pre-core
    this.meditate();
    // Core
    this.ponder();
    this.think();
    this.reflect();
    // Post-core
  }

  public ponder(): void {
    for (const roomName in this.ideas) {
      for (const ideaName in this.ideas[roomName]) {
        try {
          this.ideas[roomName][ideaName].ponder();
        } catch (error) {
          console.log(`${roomName}:${ideaName} idea error while pondering`);
          console.log(error);
        }
      }
    }
  }
  public think(): void {
    for (const roomName in this.ideas) {
      for (const ideaName in this.ideas[roomName]) {
        try {
          this.ideas[roomName][ideaName].think();
        } catch (error) {
          console.log(`${roomName}:${ideaName} idea error while thinking`);
          console.log(error);
        }
      }
    }
  }
  public reflect(): void {
    for (const roomName in this.ideas) {
      for (const ideaName in this.ideas[roomName]) {
        try {
          this.ideas[roomName][ideaName].reflect();
        } catch (error) {
          console.log(`${roomName}:${ideaName} idea error while reflecting`);
          console.log(error);
        }
      }
      try {
        // Display stats/visuals
        this.hippocampus.contemplate();
      } catch (error) {
        console.log(`${roomName} hippocampus could not contemplate`);
        console.log(error);
      }
    }
  }
}

profiler.registerClass(Imagination, "Imagination");
