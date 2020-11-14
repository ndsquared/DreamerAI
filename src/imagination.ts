/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType } from "ideas/idea";
import { Figment } from "figments/figment";
import { FigmentThought } from "thoughts/figmentThought";
import { GenesisIdea } from "ideas/genesisIdea";
import { TabulaRasaIdea } from "ideas/tabulaRasaIdea";
import { exportStats } from "utils/stats";
import profiler from "screeps-profiler";

export class Imagination implements IBrain {
  private ideas: { [name: string]: Idea };
  private consoleStatus: string[] = [];
  private generatedPixel = false;

  public constructor() {
    console.log("Global reset...");
    this.ideas = {};
    this.forget();
    this.fantasize();
  }

  /*
  https://github.com/screepers/screeps-snippets/blob/master/src/globals/JavaScript/hasRespawned.js
  */

  private shouldForget() {
    if (Game.time === 0) {
      return true;
    }
    // check if we have any creeps
    if (Object.keys(Game.creeps).length > 0) {
      return false;
    }
    // check if we only see 1 room
    const roomNames = Object.keys(Game.rooms);
    if (roomNames.length !== 1) {
      return false;
    }
    // check if we own the controller and if it has any progress
    const room = Game.rooms[roomNames[0]];
    if (
      !room.controller ||
      !room.controller.my ||
      room.controller.level !== 1 ||
      room.controller.progress ||
      !room.controller.safeMode ||
      room.controller.safeMode <= SAFE_MODE_DURATION - 1000
    ) {
      return false;
    }
    // check for 1 spawn
    if (Object.keys(Game.spawns).length !== 1) {
      return false;
    }
    // console.log("only 1 spawn");
    return true;
  }

  private forget() {
    if (this.shouldForget()) {
      console.log("forgetting...");
      Memory.imagination = {
        genesisIdeas: {},
        metabolicIdeas: {}
      };
      Memory.creeps = {};
      delete Memory.flags;
      delete Memory.rooms;
      delete Memory.spawns;
      delete Memory.powerCreeps;
    }
  }

  private fantasize() {
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      this.ideas[spawn.room.name] = new TabulaRasaIdea(spawn, this, IdeaType.TABULA_RASA, null);
    }
  }

  public imagine(): void {
    const figments = Object.keys(Game.creeps).length;
    this.consoleStatus = [];
    this.addStatus(`Tick: ${Game.time}`);
    if (Game.cpu.bucket >= 9500 && Game.cpu.generatePixel) {
      this.addStatus(`Bucket: ${Game.cpu.bucket}`);
      this.generatedPixel = true;
      Game.cpu.generatePixel();
    } else {
      this.addStatus(`Bucket: ${Game.cpu.bucket}`);
      this.generatedPixel = false;
    }
    this.addStatus(`Figments: ${figments}`);
    this.ponder();
    this.think();
    this.reflect();
  }

  private meditate() {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        const idea = this.ideas[Memory.creeps[name].ideaName];
        if (idea) (idea.ideas[IdeaType.GENESIS] as GenesisIdea).adjustFigmentCount(Memory.creeps[name].thoughtType, -1);
        delete Memory.creeps[name];
      }
    }
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      const figment = new Figment(creep.id);
      if (figment.spawning) {
        continue;
      }
      const ideaName = figment.memory.ideaName;
      const thoughtType = figment.memory.thoughtType;
      const thoughtInstance = figment.memory.thoughtInstance;
      const idea = this.ideas[ideaName];
      if (!idea) {
        continue;
      }
      const thoughtTypeObj = idea.thoughts[thoughtType];
      if (!thoughtTypeObj) {
        continue;
      }
      const thought = thoughtTypeObj[thoughtInstance] as FigmentThought;
      if (thought) {
        thought.addFigment(figment);
      }
    }
  }

  public ponder(): void {
    this.meditate();
    for (const name in this.ideas) {
      this.ideas[name].ponder();
    }
  }
  public think(): void {
    for (const name in this.ideas) {
      this.ideas[name].think();
    }
  }
  public reflect(): void {
    for (const name in this.ideas) {
      this.ideas[name].reflect();
    }
    if (this.generatedPixel) {
      this.addStatus("GENERATED PIXEL");
    }
    this.printStatus();
    exportStats();
  }

  public addStatus(status: string): void {
    this.consoleStatus.push(status);
  }

  private printStatus(): void {
    const status = this.consoleStatus.join(" | ");
    console.log(status);
  }
}

profiler.registerClass(Imagination, "Imagination");
