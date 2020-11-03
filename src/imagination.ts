/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Figment } from "figment";
import { Idea } from "ideas/idea";
import { TabulaRasaIdea } from "ideas/tabulaRasaIdea";

export class Imagination implements IBrain {
  private ideas: { [name: string]: Idea };

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
      Memory.imagination = {
        ideas: {}
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
      this.ideas[spawn.room.name] = new TabulaRasaIdea(spawn);
    }
  }

  public imagine(): void {
    const figments = Object.keys(Game.creeps).length;
    console.log(`Tick: ${Game.time} | Figments: ${figments}`);
    this.ponder();
    this.think();
    this.reflect();
  }

  private meditate() {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        const idea = this.ideas[Memory.creeps[name].ideaName];
        if (idea) idea.adjustFigmentCount(Memory.creeps[name].thoughtName, -1);
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
      const thoughtName = figment.memory.thoughtName;
      const thoughtInstance = figment.memory.thoughtInstance;
      const idea = this.ideas[ideaName];
      if (!idea) {
        continue;
      }
      const thought = idea.figmentThoughts[thoughtName][thoughtInstance];
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
  }
}
