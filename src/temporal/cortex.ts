/* eslint-disable no-underscore-dangle */
/*
This module is the main abtraction for getting room object data
*/

import { Cerebellum } from "./cerebellum";
import { Hippocampus } from "./hippocampus";
import { IdeaType } from "ideas/idea";
import { Imagination } from "imagination";
import { Metabolism } from "./metabolism";
import { Occipital } from "./occipital";
import { Spatial } from "./spatial";
import { TabulaRasaIdea } from "ideas/tabulaRasaIdea";
import { getReconRoomData } from "utils/misc";

export class Cortex implements Temporal {
  public baseRooms: { [name: string]: CortexBaseRoom } = {};
  public _imagination: Imagination;
  // Long-term memory
  private _cerebellum: Cerebellum;
  // Short-term memory
  private _hippocampus: Hippocampus;
  // Queues
  private _metabolism: Metabolism;
  // Visuals/stats
  private _occipital: Occipital;

  public constructor(imagination: Imagination) {
    this._imagination = imagination;
    this._cerebellum = new Cerebellum(this);
    this._metabolism = new Metabolism(this);
    this._hippocampus = new Hippocampus(this);
    this._occipital = new Occipital(this);
  }

  public get memory(): Memory {
    return this._cerebellum.memory;
  }

  public get imagination(): Imagination {
    return this._imagination;
  }

  public get metabolism(): Metabolism {
    return this._metabolism;
  }

  public get cerebellum(): Cerebellum {
    return this._cerebellum;
  }

  public get hippocampus(): Hippocampus {
    return this._hippocampus;
  }

  public get spatial(): Spatial {
    return this._hippocampus.spatial;
  }

  public get occipital(): Occipital {
    return this._occipital;
  }

  public fantasize(): void {
    this.cerebellum.getMemory();
    // TODO: need to handle this loop better
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      if (!this.imagination.ideas[spawn.room.name]) {
        this.imagination.ideas[spawn.room.name] = {};
        this.imagination.ideas[spawn.room.name][IdeaType.TABULA_RASA] = new TabulaRasaIdea(
          spawn.room.name,
          this.imagination,
          IdeaType.TABULA_RASA
        );
        this.addBaseRoomName(spawn);
      }
    }
  }

  public meditate(): void {
    // Reset short-term memory ever tick
    this._hippocampus = new Hippocampus(this);
    // Occipital should be first to meditate
    this.occipital.meditate();
    this.cerebellum.meditate();
    // Metabolism needs to meditate before the hippocampus
    this.metabolism.meditate();
    this.hippocampus.meditate();
  }

  public addBaseRoomName(spawn: StructureSpawn): void {
    const roomName = spawn.room.name;
    // TODO: need to calculate distance for all known rooms in memory
    this.baseRooms[roomName] = {
      baseOriginPos: spawn.pos,
      figmentPreferences: {},
      showStats: true,
      showBuildVisuals: true,
      showMetaVisuals: true,
      showEnemyVisuals: true
    };
    const neighborhoodMemory = this.memory.imagination.neighborhoods;
    if (!neighborhoodMemory.neighborhoodRoomNames[roomName]) {
      neighborhoodMemory.neighborhoodRoomNames[roomName] = [roomName];
    }
    neighborhoodMemory.roomsInNeighborhoods[roomName] = roomName;
    this.memory.rooms[roomName] = getReconRoomData(roomName);

    this._metabolism.addMetabolismQueues(roomName);
  }

  public contemplate(): void {
    // Occipital should be last to contemplate
    this.occipital.contemplate();
  }

  public toggleVisuals(roomName: string, visual: string): string {
    switch (visual) {
      case "all":
        return this.occipital.rall(roomName);
      case "stats":
        return this.occipital.rstats(roomName);
      case "build":
        return this.occipital.rbuild(roomName);
      case "meta":
        return this.occipital.rmeta(roomName);
      case "enemy":
        return this.occipital.renemy(roomName);
      case "map":
        return this.occipital.rmap();
      default:
        return `Visual does not exist: ${visual}`;
    }
  }

  public getFigmentPreferences(roomName: string): Record<string, FigmentPreference> {
    return this.baseRooms[roomName].figmentPreferences;
  }

  public getNextSpawn(roomName: string): SpawnQueuePayload | null {
    if (this.metabolism.spawnQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.spawnQueue[roomName].peek();
  }

  public getNextBuildTarget(roomName: string): BuildQueuePayload | null {
    if (this.metabolism.buildQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.buildQueue[roomName].peek();
  }

  public getNextEnemyTarget(roomName: string): Creep | Structure | null {
    if (this.metabolism.enemyQueue[roomName].length === 0) {
      return null;
    }

    return this.metabolism.enemyQueue[roomName].peek().enemyObject;
  }

  public getNextHealTarget(roomName: string): Creep | null {
    if (this.metabolism.healQueue[roomName].length === 0) {
      return null;
    }

    return this.metabolism.healQueue[roomName].peek().figment;
  }

  public getNextConstructionSite(roomName: string): ConstructionSite | null {
    if (this.metabolism.constructionSiteQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.constructionSiteQueue[roomName].peek();
  }

  public getNextRepairTarget(roomName: string): Structure | null {
    if (this.metabolism.repairQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.repairQueue[roomName].peek();
  }

  public getNextInput(roomName: string): MetabolicQueuePayload | null {
    if (this.metabolism.inputQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.inputQueue[roomName].peek();
  }

  public getNextOutput(roomName: string): MetabolicQueuePayload | null {
    if (this.metabolism.outputQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.outputQueue[roomName].peek();
  }

  public getNeighborhoodRoomNames(roomName: string): string[] {
    return this.cerebellum.memory.imagination.neighborhoods.neighborhoodRoomNames[roomName];
  }

  public getNextAvailableSpawn(roomName: string): StructureSpawn | undefined {
    for (const spawn of this.hippocampus.baseRoomObjects[roomName].spawns) {
      if (!spawn.spawning) {
        return spawn;
      }
    }
    return undefined;
  }

  public getBaseOriginPos(roomName: string): RoomPosition {
    return this.baseRooms[roomName].baseOriginPos;
  }

  public getNextReconRoomName(): string | undefined {
    if (this.spatial.reconRoomNames.length === 0) {
      this.spatial.populateReconRoomNames();
    }
    return this.spatial.reconRoomNames.shift();
  }

  public getTotalFigmentsInNeighborhood(roomName: string): number {
    return this.hippocampus.neighborhood[roomName].neighborhoodCreeps.length;
  }

  public addReconRoomData(room: Room): void {
    if (!this.memory.rooms[room.name]) {
      this.memory.rooms[room.name] = getReconRoomData(room.name);
    }
  }
}
