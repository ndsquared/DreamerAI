/*
This module is responsible for managing room data and memory
*/
import { RoomType, getNeighborRoomNames, getReconRoomData, getRoomType } from "utils/misc";
import { Cortex } from "./cortex";

export class Spatial implements Temporal {
  public cortex: Cortex;
  public reconRoomNames: string[] = [];
  public standardRoomNames: string[] = [];
  public centerRoomNames: string[] = [];
  public highwayRoomNames: string[] = [];
  public crossroadRoomNames: string[] = [];
  public unknownRoomNames: string[] = [];
  public sourceKeeperRoomNames: string[] = [];

  public constructor(cortex: Cortex) {
    this.cortex = cortex;
  }

  public meditate(): void {
    throw new Error("Method not implemented.");
  }
  public contemplate(): void {
    throw new Error("Method not implemented.");
  }

  public processRoom(roomName: string): void {
    const room = Game.rooms[roomName];
    const roomMemory = this.cortex.memory.rooms[roomName];
    if (room) {
      this.scoreRoom(room, roomMemory);
    }
    switch (roomMemory.roomType) {
      case RoomType.ROOM_CENTER:
        this.centerRoomNames.push(roomName);
        break;
      case RoomType.ROOM_SOURCE_KEEPER:
        this.sourceKeeperRoomNames.push(roomName);
        break;
      case RoomType.ROOM_HIGHWAY:
        this.highwayRoomNames.push(roomName);
        break;
      case RoomType.ROOM_CROSSROAD:
        this.crossroadRoomNames.push(roomName);
        break;
      case RoomType.ROOM_UNKNOWN:
        this.unknownRoomNames.push(roomName);
        break;
      case RoomType.ROOM_STANDARD:
        this.standardRoomNames.push(roomName);
        break;
    }
  }

  private scoreRoom(room: Room, roomMemory: RoomMemory): void {
    if (roomMemory.roomType !== RoomType.ROOM_STANDARD) {
      return;
    }
    const enemyCreeps = this.cortex.hippocampus.roomObjects[room.name].enemyCreeps;
    const enemyStructures = this.cortex.hippocampus.roomObjects[room.name].enemyStructures;
    if (enemyCreeps.length) {
      roomMemory.defendScore = enemyCreeps.length;
    } else {
      delete roomMemory.defendScore;
    }
    if (enemyStructures.length) {
      roomMemory.attackScore = enemyStructures.length;
    } else {
      delete roomMemory.attackScore;
    }
    if (!roomMemory.expansionScore) {
      let expandScore = 0;
      const terrainScore = this.getTerrainScore(room.name);
      const sources = this.cortex.hippocampus.roomObjects[room.name].sources;
      expandScore += terrainScore;
      expandScore += sources.length * 10;
      roomMemory.expansionScore = expandScore;
    }
  }

  private getTerrainScore(roomName: string): number {
    let swampTiles = 0;
    let wallTiles = 0;
    let plainTiles = 0;
    const terrain = new Room.Terrain(roomName);
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        const tile = terrain.get(x, y);
        switch (tile) {
          case TERRAIN_MASK_SWAMP:
            swampTiles++;
            break;
          case TERRAIN_MASK_WALL:
            wallTiles++;
            break;
          default:
            plainTiles++;
            break;
        }
      }
    }
    const total = swampTiles + wallTiles + plainTiles;
    if (total !== 50 * 50) {
      console.log(`Total mismatch for room ${roomName}`);
    }
    let score = 10;
    if (swampTiles / total > 0.4) {
      score -= 5;
      console.log(`${roomName} was found to be swampy`);
    }
    if (wallTiles / total > 0.4) {
      score -= 2;
      console.log(`${roomName} was found to be wally`);
    }
    return score;
  }

  public populateReconRoomNames(): void {
    const visitedRoomNames = Object.keys(this.cortex.memory.rooms);
    for (const visitedRoomName of visitedRoomNames) {
      const neighborRoomNames = getNeighborRoomNames(visitedRoomName);
      for (const neighborRoomName of neighborRoomNames) {
        if (!this.cortex.memory.rooms[neighborRoomName]) {
          const roomType = getRoomType(neighborRoomName);
          if (roomType !== RoomType.ROOM_STANDARD) {
            this.cortex.memory.rooms[neighborRoomName] = getReconRoomData(neighborRoomName);
          } else if (!this.reconRoomNames.includes(neighborRoomName)) {
            this.reconRoomNames.push(neighborRoomName);
          }
        }
      }
    }
  }
}
