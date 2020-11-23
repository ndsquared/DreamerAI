import { RoomType } from "utils/misc";

export class Spatial {
  public reconRoomNames: string[] = [];
  public standardRoomNames: string[] = [];
  public centerRoomNames: string[] = [];
  public highwayRoomNames: string[] = [];
  public crossroadRoomNames: string[] = [];
  public unknownRoomNames: string[] = [];
  public neighborhoodRoomNames: string[] = [];
  public sourceKeeperRoomNames: string[] = [];

  public processRoomName(roomName: string, roomMemory: RoomMemory): void {
    const room = Game.rooms[roomName];
    if (room) {
      this.scoreRoom(room);
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
        if (roomMemory.roomDistance < this.neighborhoodThreshold) {
          this.neighborhoodRoomNames.push(roomName);
          if (room) {
            this.enemyCreeps = this.enemyCreeps.concat(this.roomObjects[roomName][FIND_HOSTILE_CREEPS]);
            this.myCreeps = this.myCreeps.concat(this.roomObjects[roomName][FIND_MY_CREEPS]);
            this.structures = this.structures.concat(this.roomObjects[roomName][FIND_STRUCTURES]);
            this.constructionSites = this.constructionSites.concat(this.roomObjects[roomName][FIND_CONSTRUCTION_SITES]);
            this.droppedResources = this.droppedResources.concat(this.roomObjects[roomName][FIND_DROPPED_RESOURCES]);
            this.sources = this.sources.concat(this.roomObjects[roomName][FIND_SOURCES]);
          }
        } else {
          this.standardRoomNames.push(roomName);
        }
        break;
    }
  }

  private scoreRoom(room: Room): void {
    const hostiles = this.roomObjects[room.name][FIND_HOSTILE_CREEPS];
    const hostileStructures: Structure[] = [];
    for (const s of this.roomObjects[room.name][FIND_STRUCTURES]) {
      if (s instanceof OwnedStructure) {
        if (!s.my && !isInvulnerableStructure(s)) {
          hostileStructures.push(s);
        }
      }
    }
    if (
      hostiles.length &&
      this.memoryTerritory.rooms[room.name].roomDistance < this.neighborhoodThreshold &&
      this.memoryTerritory.rooms[room.name].roomType === RoomType.ROOM_STANDARD
    ) {
      this.memoryTerritory.rooms[room.name].defendScore = hostiles.length;
    } else {
      delete this.memoryTerritory.rooms[room.name].defendScore;
    }
    if (hostileStructures.length && this.memoryTerritory.rooms[room.name].roomType !== RoomType.ROOM_SOURCE_KEEPER) {
      this.memoryTerritory.rooms[room.name].attackScore = hostileStructures.length;
    } else {
      delete this.memoryTerritory.rooms[room.name].attackScore;
    }
    if (
      !this.memoryTerritory.rooms[room.name].expansionScore &&
      this.memoryTerritory.rooms[room.name].roomDistance > this.neighborhoodThreshold * 2 &&
      this.memoryTerritory.rooms[room.name].roomDistance < this.neighborhoodThreshold * 3 &&
      this.memoryTerritory.rooms[room.name].roomType === RoomType.ROOM_STANDARD
    ) {
      let expandScore = 0;
      const terrainScore = this.getTerrainScore(room.name);
      expandScore += terrainScore;
      expandScore += this.roomObjects[room.name][FIND_SOURCES].length * 10;
      this.memoryTerritory.rooms[room.name].expansionScore = expandScore;
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

  public getNextReconRoomName(): string | undefined {
    if (this.reconRoomNames.length === 0) {
      this.populateReconRoomNames();
    }
    return this.reconRoomNames.shift();
  }

  private populateReconRoomNames(): void {
    const visitedRoomNames = Object.keys(this.memoryTerritory.rooms);
    for (const visitedRoomName of visitedRoomNames) {
      const neighborRoomNames = getNeighborRoomNames(visitedRoomName);
      for (const neighborRoomName of neighborRoomNames) {
        if (!this.memoryTerritory.rooms[neighborRoomName]) {
          const roomType = getRoomType(neighborRoomName);
          if (roomType !== RoomType.ROOM_STANDARD) {
            this.memoryTerritory.rooms[neighborRoomName] = getReconRoomData(this.spawnRoom.name, neighborRoomName);
          } else if (!this.reconRoomNames.includes(neighborRoomName)) {
            this.reconRoomNames.push(neighborRoomName);
          }
        }
      }
    }
  }

  public addReconRoomData(room: Room): void {
    if (!this.memoryTerritory.rooms[room.name]) {
      this.memoryTerritory.rooms[room.name] = getReconRoomData(this.spawnRoom.name, room.name);
    }
  }
}
