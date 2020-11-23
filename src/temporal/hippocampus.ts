import { Cerebellum } from "./cerebellum";
import { Cortex } from "./cortex";
import { Imagination } from "imagination";
import { Metabolism } from "./metabolism";
import { Occipital } from "./occipital";
import { Spatial } from "./spatial";

export class Hippocampus {
  private baseRooms: HippocampusBaseRoom[] = [];
  private imagination: Imagination;
  // Long-term memory
  private cerebellum: Cerebellum;
  // Short-term memory
  private cortex: Cortex;
  // Queues
  private metabolism: Metabolism;
  // Room data
  private spatial: Spatial;
  // Visuals/stats
  private occipital: Occipital;

  public constructor(imagination: Imagination) {
    this.imagination = imagination;
    this.cerebellum = new Cerebellum(imagination);
    this.metabolism = new Metabolism();
    this.cortex = new Cortex(this.metabolism);
    this.spatial = new Spatial();
    this.occipital = new Occipital(this);
  }

  public meditate(): void {
    this.forget();
    this.cerebellum.meditate();
    this.remember();
  }

  public addBaseRoomName(roomName: string): void {
    this.baseRooms.push({
      roomName,
      showStats: false,
      showBuildVisuals: false,
      showMetaVisuals: false,
      showEnemyVisuals: false,
      showMapVisuals: false
    });
  }

  public forget(): void {
    this.cerebellum.forget();
    this.metabolism.forget();
  }

  public remember(): void {
    this.cortex = new Cortex(this.metabolism);
    for (const roomName in this.cerebellum.memory.rooms) {
      const room = Game.rooms[roomName];
      if (room) {
        this.cortex.getRoomObjects(room);
      }
      const roomMemory = this.cerebellum.memory.rooms[roomName];
      this.spatial.processRoomName(roomName, roomMemory);
    }
    this.cortex.remember();
  }

  public contemplate(): void {
    this.occipital.visualize();
  }

  public getNextEnemyTarget(roomName: string): Creep | Structure | null {
    if (this.enemyQueue.length === 0) {
      return null;
    }

    return this.enemyQueue.peek().enemyObject;
  }

  public getNextHealTarget(roomName: string): Creep | null {
    if (this.healQueue.length === 0) {
      return null;
    }

    return this.healQueue.peek().figment;
  }

  public getNextConstructionSite(roomName: string): ConstructionSite | null {
    if (this.constructionSiteQueue.length === 0) {
      return null;
    }
    return this.constructionSiteQueue.peek();
  }

  public getNextRepairTarget(roomName: string): Structure | null {
    if (this.repairQueue.length === 0) {
      return null;
    }
    return this.repairQueue.peek();
  }

  public getNeighborhoodRoomNames(roomName: string): string[] {
    // TODO: Implement
    return [];
  }

  public getNextAvailableSpawn(roomName: string): StructureSpawn | undefined {
    // TODO: Implement this for real
    return undefined;
  }

  public getBaseOriginPos(roomName: string): RoomPosition {
    // TODO: Implement this for real
    return new RoomPosition(25, 25, roomName);
  }
}
