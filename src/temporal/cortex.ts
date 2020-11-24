/* eslint-disable no-underscore-dangle */
/*
This module is the main abtraction for getting room object data
*/

import { Cerebellum } from "./cerebellum";
import { Hippocampus } from "./hippocampus";
import { Imagination } from "imagination";
import { Metabolism } from "./metabolism";
import { Occipital } from "./occipital";
import { Spatial } from "./spatial";

export class Cortex implements Temporal {
  public baseRooms: { [name: string]: CortexBaseRoom } = {};
  public _imagination: Imagination;
  // Long-term memory
  private _cerebellum: Cerebellum;
  // Short-term memory
  private _hippocampus: Hippocampus;
  // Queues
  private _metabolism: Metabolism;
  // Room data
  private _spatial: Spatial;
  // Visuals/stats
  private _occipital: Occipital;

  public constructor(imagination: Imagination) {
    this._imagination = imagination;
    this._cerebellum = new Cerebellum(this);
    this._metabolism = new Metabolism(this);
    this._hippocampus = new Hippocampus(this);
    this._spatial = new Spatial(this);
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
    return this._spatial;
  }

  public get occipital(): Occipital {
    return this._occipital;
  }

  public meditate(): void {
    // Reset short-term memory ever tick
    this._hippocampus = new Hippocampus(this);
    // Occipital should be first to meditate
    this.occipital.meditate();
    this.cerebellum.meditate();
    this.hippocampus.meditate();
    this.metabolism.meditate();
    this.spatial.meditate();
  }

  public addBaseRoomName(spawn: StructureSpawn): void {
    // TODO: need to calculate distance for all known rooms in memory
    this.baseRooms[spawn.room.name] = {
      baseOriginPos: spawn.pos,
      showStats: false,
      showBuildVisuals: false,
      showMetaVisuals: false,
      showEnemyVisuals: false
    };

    this._metabolism.addMetabolismQueues(spawn.room.name);
  }

  public contemplate(): void {
    this.cerebellum.contemplate();
    this.hippocampus.contemplate();
    this.metabolism.contemplate();
    this.spatial.contemplate();
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

  public getFigmentPreferences(roomName: string): FigmentPreferences | null {
    return this._hippocampus.figmentPreferences[roomName];
  }

  public getNextSpawn(roomName: string): SpawnQueuePayload | null {
    if (this.metabolism.spawnQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.spawnQueue[roomName].peek();
  }

  public getNextBuildTarget(roomName: string): ConstructionSite | null {
    if (this.metabolism.constructionSiteQueue[roomName].length === 0) {
      return null;
    }
    return this.metabolism.constructionSiteQueue[roomName].peek();
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
}
