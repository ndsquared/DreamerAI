/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType } from "ideas/idea";
import { Figment } from "figments/figment";
import { FigmentThought } from "thoughts/figmentThought";
import { TabulaRasaIdea } from "ideas/tabulaRasaIdea";
import profiler from "screeps-profiler";

export class Imagination implements IBrain {
  public ideas: { [name: string]: { [name: string]: Idea } };
  private consoleStatus: string[] = [];
  private generatedPixel = false;
  public memory: Memory = {
    version: 0,
    imagination: {
      version: 0,
      genesisIdeas: {},
      metabolicIdeas: {}
    },
    stats: {
      time: 0,
      gcl: {},
      rooms: {},
      cpu: {}
    },
    creeps: {},
    powerCreeps: {},
    rooms: {},
    spawns: {},
    flags: {}
  };

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
    if (!Memory.version) {
      Memory.version = 0;
    }
    if (this.shouldForget() || !Memory.imagination || Memory.version !== Memory.imagination.version) {
      console.log("forgetting...");
      Memory.imagination = {
        version: Memory.version,
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
      this.ideas[spawn.room.name] = {};
      this.ideas[spawn.room.name][IdeaType.TABULA_RASA] = new TabulaRasaIdea(spawn, this, IdeaType.TABULA_RASA);
    }
  }

  public imagine(): void {
    if (Game.cpu.bucket < 200) {
      console.log(`Not enough CPU in bucket to run! | Bucket: ${Game.cpu.bucket}`);
      return;
    }
    this.memory = Memory;
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
    RawMemory.set(JSON.stringify(this.memory));
    this.addStatus(`CPU Usage: ${Game.cpu.getUsed().toFixed(0)}`);
    this.addStatus(`CPU Limit: ${Game.cpu.limit}`);
    this.addStatus(`CPU Tick Limit: ${Game.cpu.tickLimit}`);
    if (this.generatedPixel) {
      this.addStatus("GENERATED PIXEL");
    }
    this.printStatus();
    // exportStats();
  }

  private meditate() {
    for (const ideaName in this.ideas) {
      // Reset figment count
      this.memory.imagination.genesisIdeas[ideaName] = {
        figmentCount: {}
      };
      // Initialize metabolism
      if (!this.memory.imagination.metabolicIdeas[ideaName]) {
        this.memory.imagination.metabolicIdeas[ideaName] = {
          metabolism: {
            inputs: {},
            outputs: {}
          }
        };
      }
    }
    // Clean up figment memory
    for (const name in this.memory.creeps) {
      const ideaName = this.memory.creeps[name].ideaName;
      const figmentType = this.memory.creeps[name].figmentType;
      if (!(name in Game.creeps)) {
        delete this.memory.creeps[name];
      } else {
        // Set figment count
        if (this.memory.imagination.genesisIdeas[ideaName].figmentCount[figmentType]) {
          this.memory.imagination.genesisIdeas[ideaName].figmentCount[figmentType] += 1;
        } else {
          this.memory.imagination.genesisIdeas[ideaName].figmentCount[figmentType] = 1;
        }
      }
    }
    // Clean up metabolism memory
    for (const ideaName in this.ideas) {
      if (this.memory.imagination.metabolicIdeas[ideaName].metabolism.inputs) {
        for (const ref in this.memory.imagination.metabolicIdeas[ideaName].metabolism.inputs) {
          for (const name in this.memory.imagination.metabolicIdeas[ideaName].metabolism.inputs[ref]) {
            if (!(name in Game.creeps)) {
              delete this.memory.imagination.metabolicIdeas[ideaName].metabolism.inputs[ref][name];
            }
          }
        }
      }
      if (this.memory.imagination.metabolicIdeas[ideaName].metabolism.outputs) {
        for (const ref in this.memory.imagination.metabolicIdeas[ideaName].metabolism.outputs) {
          for (const name in this.memory.imagination.metabolicIdeas[ideaName].metabolism.outputs[ref]) {
            if (!(name in Game.creeps)) {
              delete this.memory.imagination.metabolicIdeas[ideaName].metabolism.outputs[ref][name];
            }
          }
        }
      }
    }
    // Assign figments to thoughts
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
      const thoughtTypeObj = idea[IdeaType.GENESIS].thoughts[thoughtType];
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
    for (const roomName in this.ideas) {
      for (const ideaName in this.ideas[roomName]) {
        try {
          this.ideas[roomName][ideaName].ponder();
        } catch (error) {
          console.log(`${roomName}:${ideaName} idea error while pondering`);
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
        }
      }
    }
  }

  public addStatus(status: string): void {
    this.consoleStatus.push(status);
  }

  private printStatus(): void {
    const status = this.consoleStatus.join(" | ");
    console.log(status);
  }

  public rall(roomName: string): string {
    if (!this.ideas[roomName]) {
      return `Could not toggle all visuals for ${roomName}`;
    }
    this.rstats(roomName);
    this.rbuild(roomName);
    this.rmeta(roomName);
    return `Successfully toggled all visuals for ${roomName}`;
  }

  public rstats(roomName: string): string {
    if (!this.ideas[roomName]) {
      return `Could not toggle room stats for ${roomName}`;
    }
    for (const ideaName in this.ideas[roomName]) {
      this.ideas[roomName][ideaName].showStats = !this.ideas[roomName].showStats;
    }
    return `Successfully toggled room stats for ${roomName}`;
  }

  public rbuild(roomName: string): string {
    if (!this.ideas[roomName]) {
      return `Could not toggle room build visuals for ${roomName}`;
    }
    for (const ideaName in this.ideas[roomName]) {
      this.ideas[roomName][ideaName].showBuildVisuals = !this.ideas[roomName].showBuildVisuals;
    }
    return `Successfully toggled room build visuals for ${roomName}`;
  }

  public rmeta(roomName: string): string {
    if (!this.ideas[roomName]) {
      return `Could not toggle room metabolic visuals for ${roomName}`;
    }
    for (const ideaName in this.ideas[roomName]) {
      this.ideas[roomName][ideaName].showMetaVisuals = !this.ideas[roomName].showMetaVisuals;
    }
    return `Successfully toggled room metabolic visuals for ${roomName}`;
  }
}

profiler.registerClass(Imagination, "Imagination");
