/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Idea, IdeaType } from "ideas/idea";
import { getReconRoomData, getUsername } from "utils/misc";
import { Figment } from "figments/figment";
import { FigmentThought } from "thoughts/figmentThought";
import { Hippocampus } from "hippocampus";
import { TabulaRasaIdea } from "ideas/tabulaRasaIdea";
import profiler from "screeps-profiler";

export class Imagination implements IBrain {
  public username: string;
  public ideas: { [name: string]: { [name: string]: Idea } };
  private consoleStatus: string[] = [];
  private generatedPixel = false;
  public memory: Memory = {
    version: 0,
    imagination: {
      version: 0,
      genesis: {},
      metabolic: {},
      territory: {}
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
  public hippocampus: { [name: string]: Hippocampus };

  public constructor() {
    console.log("Global reset...");
    this.username = getUsername();
    this.ideas = {};
    this.hippocampus = {};
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
        genesis: {},
        metabolic: {},
        territory: {}
      };
      Memory.creeps = {};
      delete Memory.flags;
      delete Memory.rooms;
      delete Memory.spawns;
      delete Memory.powerCreeps;
      if (Memory.stats) {
        delete Memory.stats;
      }
    }
  }

  private fantasize() {
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      // TODO: need to handle multiple spawns better
      if (!this.ideas[spawn.room.name]) {
        this.ideas[spawn.room.name] = {};
        this.ideas[spawn.room.name][IdeaType.TABULA_RASA] = new TabulaRasaIdea(spawn, this, IdeaType.TABULA_RASA);
        this.hippocampus[spawn.room.name] = new Hippocampus(spawn, this);
      }
    }
  }

  public imagine(): void {
    // CPU guard
    if (Game.cpu.bucket < 200) {
      console.log(`Not enough CPU in bucket to run! | Bucket: ${Game.cpu.bucket}`);
      return;
    }
    // Initial status
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
    // Core
    this.meditate();
    this.ponder();
    this.think();
    this.reflect();
    // Ending status
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
      this.memory.imagination.genesis[ideaName] = {
        figmentCount: {}
      };
      // Initialize metabolism
      if (!this.memory.imagination.metabolic[ideaName]) {
        this.memory.imagination.metabolic[ideaName] = {
          metabolism: {
            inputs: {},
            outputs: {}
          }
        };
      }
      // Initialize territory
      if (!this.memory.imagination.territory[ideaName]) {
        this.memory.imagination.territory[ideaName] = {
          rooms: {}
        };
        // Seed spawn room
        const room = Game.rooms[ideaName];
        if (room) {
          this.memory.imagination.territory[ideaName].rooms[ideaName] = getReconRoomData(room.name, room.name);
        }
      }
      try {
        this.hippocampus[ideaName].remember();
      } catch (error) {
        console.log(`${ideaName} hippocampus could not remember`);
        console.log(error);
      }
    }
    // Clean up figment memory
    for (const name in this.memory.creeps) {
      const ideaName = this.memory.creeps[name].ideaName;
      const figmentType = this.memory.creeps[name].figmentType;
      if (!(name in Game.creeps)) {
        delete this.memory.creeps[name];
      } else if (ideaName && figmentType) {
        // Set figment count
        if (this.memory.imagination.genesis[ideaName].figmentCount[figmentType]) {
          this.memory.imagination.genesis[ideaName].figmentCount[figmentType] += 1;
        } else {
          this.memory.imagination.genesis[ideaName].figmentCount[figmentType] = 1;
        }
      } else {
        const orphanedCreep = Game.creeps[name];
        orphanedCreep.suicide();
        console.log(`${orphanedCreep.name} committed suduko!`);
      }
    }
    // Clean up metabolism memory
    for (const ideaName in this.ideas) {
      if (this.memory.imagination.metabolic[ideaName].metabolism.inputs) {
        for (const ref in this.memory.imagination.metabolic[ideaName].metabolism.inputs) {
          for (const name in this.memory.imagination.metabolic[ideaName].metabolism.inputs[ref]) {
            if (!(name in Game.creeps)) {
              delete this.memory.imagination.metabolic[ideaName].metabolism.inputs[ref][name];
            }
          }
        }
      }
      if (this.memory.imagination.metabolic[ideaName].metabolism.outputs) {
        for (const ref in this.memory.imagination.metabolic[ideaName].metabolism.outputs) {
          for (const name in this.memory.imagination.metabolic[ideaName].metabolism.outputs[ref]) {
            if (!(name in Game.creeps)) {
              delete this.memory.imagination.metabolic[ideaName].metabolism.outputs[ref][name];
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
        this.hippocampus[roomName].contemplate();
      } catch (error) {
        console.log(`${roomName} hippocampus could not contemplate`);
        console.log(error);
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
    if (!this.hippocampus[roomName]) {
      return `Could not toggle all stats/visuals for ${roomName}`;
    }
    this.rstats(roomName);
    this.rbuild(roomName);
    this.rmeta(roomName);
    this.renemy(roomName);
    this.rmap(roomName);
    return `Successfully toggled all stats/visuals for ${roomName}`;
  }

  public rstats(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle stats for ${roomName}`;
    }
    this.hippocampus[roomName].showStats = !this.hippocampus[roomName].showStats;
    return `Successfully toggled stats for ${roomName}`;
  }

  public rbuild(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle build visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showBuildVisuals = !this.hippocampus[roomName].showBuildVisuals;
    return `Successfully toggled build visuals for ${roomName}`;
  }

  public rmeta(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle metabolic visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showMetaVisuals = !this.hippocampus[roomName].showMetaVisuals;
    return `Successfully toggled metabolic visuals for ${roomName}`;
  }

  public renemy(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle enemy visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showEnemyVisuals = !this.hippocampus[roomName].showEnemyVisuals;
    return `Successfully toggled enemy visuals for ${roomName}`;
  }

  public rmap(roomName: string): string {
    if (!this.hippocampus[roomName]) {
      return `Could not toggle map visuals for ${roomName}`;
    }
    this.hippocampus[roomName].showMapVisuals = !this.hippocampus[roomName].showMapVisuals;
    return `Successfully toggled map visuals for ${roomName}`;
  }
}

profiler.registerClass(Imagination, "Imagination");
