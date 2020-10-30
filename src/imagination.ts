import { Idea } from "ideas/idea";

export class Imagination implements IBrain {
  private ideas: { [name: string]: Idea };

  constructor() {
    this.ideas = {};
    this.forget();
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
    // check we own the controller
    const room = Game.rooms[roomNames[0]];
    if (
      !room.controller ||
      !room.controller.my ||
      room.controller.level !== 1 ||
      room.controller.progress ||
      !room.controller.safeMode ||
      room.controller.safeMode <= SAFE_MODE_DURATION - 1
    ) {
      return false;
    }
    // check for 1 spawn
    if (Object.keys(Game.spawns).length !== 1) {
      return false;
    }
    return true;
  }

  private forget() {
    if (this.shouldForget()) {
      console.log("forgetting...");
      Memory.imagination = {};
      Memory.creeps = {};
      delete Memory.flags;
      delete Memory.rooms;
      delete Memory.spawns;
      delete Memory.powerCreeps;
    }
  }

  imagine() {
    const figments = Object.keys(Game.creeps).length;
    console.log(`Tick: ${Game.time} | Figments: ${figments}`);
    this.ponder();
    this.think();
    this.reflect();
  }

  private meditate() {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }
  }

  ponder() {
    this.meditate();
    for (const ideaName in this.ideas) {
      this.ideas[ideaName].ponder();
    }
  }
  think() {
    for (const ideaName in this.ideas) {
      this.ideas[ideaName].think();
    }
  }
  reflect() {
    for (const ideaName in this.ideas) {
      this.ideas[ideaName].reflect();
    }
  }
}
