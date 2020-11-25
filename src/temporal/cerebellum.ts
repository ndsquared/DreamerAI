/*
This module is responsible for long-term memory management
*/
import { Cortex } from "./cortex";
import { Figment } from "figments/figment";
import { FigmentThought } from "thoughts/figmentThought";
import { IdeaType } from "ideas/idea";
import { getReconRoomData } from "utils/misc";

export class Cerebellum implements Temporal {
  private cortex: Cortex;
  // TODO: need to DRY memory declarations up
  public memory: Memory = {
    version: 0,
    imagination: {
      version: 0,
      genesis: {},
      metabolic: {},
      neighborhoods: {
        neighborhoodRoomNames: {},
        roomsInNeighborhoods: {}
      }
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

  public constructor(cortex: Cortex) {
    this.cortex = cortex;
  }

  public meditate(): void {
    this.initializeMemory();
    this.pruneFigments();
    this.assignFigments();
    this.pruneIO();
  }

  public getMemory(): void {
    this.forget();
    this.memory = Memory;
  }

  public genesisMemory(roomName: string): GenesisMemory {
    return this.memory.imagination.genesis[roomName];
  }

  public metabolicMemory(roomName: string): MetabolicMemory {
    return this.memory.imagination.metabolic[roomName];
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

  public forget(): void {
    if (!Memory.version) {
      Memory.version = 0;
    }
    if (
      global.resetMemory ||
      this.shouldForget() ||
      !Memory.imagination ||
      Memory.version !== Memory.imagination.version
    ) {
      console.log("forgetting...");
      Memory.imagination = {
        version: Memory.version,
        genesis: {},
        metabolic: {},
        neighborhoods: {
          neighborhoodRoomNames: {},
          roomsInNeighborhoods: {}
        }
      };
      Memory.creeps = {};
      Memory.rooms = {};
      delete Memory.flags;
      delete Memory.spawns;
      delete Memory.powerCreeps;
      delete Memory.stats;
    }
  }

  public initializeMemory(): void {
    for (const roomName in this.cortex.baseRooms) {
      // Reset figment count
      this.memory.imagination.genesis[roomName] = {
        figmentCount: {}
      };
      // Initialize metabolism
      if (!this.memory.imagination.metabolic[roomName]) {
        this.memory.imagination.metabolic[roomName] = {
          metabolism: {
            inputs: {},
            outputs: {}
          }
        };
      }
      // Initialize territory
      if (!this.memory.rooms) {
        this.memory.rooms = {};
        // Seed spawn room
        const room = Game.rooms[roomName];
        if (room) {
          this.memory.rooms[roomName] = getReconRoomData(room.name);
        }
      }
    }
  }
  public pruneFigments(): void {
    for (const name in this.memory.creeps) {
      const roomName = this.memory.creeps[name].roomName;
      const figmentType = this.memory.creeps[name].figmentType;
      if (!(name in Game.creeps)) {
        delete this.memory.creeps[name];
      } else if (roomName && figmentType) {
        // Set figment count
        if (this.memory.imagination.genesis[roomName].figmentCount[figmentType]) {
          this.memory.imagination.genesis[roomName].figmentCount[figmentType] += 1;
        } else {
          this.memory.imagination.genesis[roomName].figmentCount[figmentType] = 1;
        }
      } else {
        const orphanedCreep = Game.creeps[name];
        orphanedCreep.suicide();
        console.log(`${orphanedCreep.name} committed suduko!`);
      }
    }
  }
  public assignFigments(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      const figment = new Figment(creep.id, this.cortex.imagination);
      if (figment.spawning) {
        continue;
      }
      const roomName = figment.memory.roomName;
      const thoughtType = figment.memory.thoughtType;
      const thoughtInstance = figment.memory.thoughtInstance;
      const idea = this.cortex.imagination.ideas[roomName];
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
  private pruneIO(): void {
    for (const baseRoomName in this.memory.imagination.metabolic) {
      for (const input in this.memory.imagination.metabolic[baseRoomName].metabolism.inputs) {
        if (!Game.getObjectById(input)) {
          delete this.memory.imagination.metabolic[baseRoomName].metabolism.inputs[input];
        }
      }
      for (const output in this.memory.imagination.metabolic[baseRoomName].metabolism.outputs) {
        if (!Game.getObjectById(output)) {
          delete this.memory.imagination.metabolic[baseRoomName].metabolism.outputs[output];
        }
      }
    }
    for (const roomName in this.cortex.imagination.ideas) {
      if (this.memory.imagination.metabolic[roomName].metabolism.inputs) {
        for (const ref in this.memory.imagination.metabolic[roomName].metabolism.inputs) {
          for (const name in this.memory.imagination.metabolic[roomName].metabolism.inputs[ref]) {
            if (!(name in Game.creeps)) {
              delete this.memory.imagination.metabolic[roomName].metabolism.inputs[ref][name];
            }
          }
        }
      }
      if (this.memory.imagination.metabolic[roomName].metabolism.outputs) {
        for (const ref in this.memory.imagination.metabolic[roomName].metabolism.outputs) {
          for (const name in this.memory.imagination.metabolic[roomName].metabolism.outputs[ref]) {
            if (!(name in Game.creeps)) {
              delete this.memory.imagination.metabolic[roomName].metabolism.outputs[ref][name];
            }
          }
        }
      }
    }
  }
}
