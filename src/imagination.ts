/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Cortex } from "temporal/cortex";
import { Idea } from "ideas/idea";
import { getUsername } from "utils/misc";
import profiler from "screeps-profiler";

export class Imagination implements IBrain {
  public username: string;
  public ideas: { [name: string]: { [name: string]: Idea } };
  public cortex: Cortex;

  public constructor() {
    console.log("Global reset...");
    this.username = getUsername();
    this.ideas = {};
    this.cortex = new Cortex(this);
  }

  public imagine(): void {
    // CPU guard
    if (Game.cpu.bucket < 200) {
      console.log(`Not enough CPU in bucket to run! | Bucket: ${Game.cpu.bucket}`);
      return;
    }

    // Pre-core
    this.cortex.fantasize();
    try {
      this.cortex.meditate();
    } catch (error) {
      console.log(`cortex could not meditate`);
      console.log(error);
    }

    // Core
    this.ponder();
    this.think();
    this.reflect();

    // Post-core
    try {
      // Display stats/visuals
      this.cortex.contemplate();
    } catch (error) {
      console.log(`cortex could not contemplate`);
      console.log(error);
    }
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
    }
  }

  public v(roomName: string, visual: string): string {
    return this.cortex.toggleVisuals(roomName, visual);
  }
}

profiler.registerClass(Imagination, "Imagination");
