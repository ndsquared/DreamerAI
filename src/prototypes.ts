/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Traveler } from "./utils/traveler";

// Creep
Creep.prototype.travelTo = function (destination: RoomPosition | { pos: RoomPosition }, options?: TravelToOptions) {
  return Traveler.travelTo(this, destination, options);
};

// RoomPosition

Object.defineProperty(RoomPosition.prototype, "isEdge", {
  get() {
    return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
  }
});

Object.defineProperty(RoomPosition.prototype, "isVisible", {
  get() {
    return Game.rooms[this.roomName] !== undefined;
  },
  configurable: true
});

Object.defineProperty(RoomPosition.prototype, "neighbors", {
  get() {
    const adjPos: RoomPosition[] = [];
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        if (!(dx === 0 && dy === 0)) {
          const x = this.x + dx;
          const y = this.y + dy;
          if (0 < x && x < 49 && 0 < y && y < 49) {
            adjPos.push(new RoomPosition(x, y, this.roomName));
          }
        }
      }
    }
    return adjPos;
  }
});

Object.defineProperty(RoomPosition.prototype, "availableToMove", {
  get() {
    const figments = (this as RoomPosition).lookFor(LOOK_CREEPS);
    if (figments.length) {
      return false;
    }
    return true;
  }
});

RoomPosition.prototype.availableNeighbors = function (ignoreCreeps = false): RoomPosition[] {
  return _.filter(this.neighbors, pos => pos.isWalkable(ignoreCreeps));
};

RoomPosition.prototype.isWalkable = function (ignoreCreeps = false): boolean {
  if (Game.map.getRoomTerrain(this.roomName).get(this.x, this.y) === TERRAIN_MASK_WALL) {
    return false;
  }
  if (this.isVisible) {
    if (ignoreCreeps === false && this.lookFor(LOOK_CREEPS).length > 0) {
      return false;
    }
    if (_.filter(this.lookFor(LOOK_STRUCTURES), (s: Structure) => !s.isWalkable).length > 0) {
      return false;
    }
  }
  return true;
};

// Structure
Object.defineProperty(Structure.prototype, "isWalkable", {
  get() {
    return (
      this.structureType === STRUCTURE_ROAD ||
      this.structureType === STRUCTURE_CONTAINER ||
      (this.structureType === STRUCTURE_RAMPART &&
        ((this.my as StructureRampart) || (this.isPublic as StructureRampart)))
    );
  },
  configurable: true
});

Object.defineProperty(Structure.prototype, "hasEnergyCapacity", {
  get() {
    if (isStoreStructure(this)) {
      return this.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    } else if (isEnergyStructure(this)) {
      return this.energy < this.energyCapacity;
    }
    return false;
  },
  configurable: true
});

Object.defineProperty(Structure.prototype, "hasEnergy", {
  get() {
    if (isStoreStructure(this)) {
      return this.store[RESOURCE_ENERGY] > 0;
    } else if (isEnergyStructure(this)) {
      return this.energy > 0;
    }
    return false;
  },
  configurable: true
});

Object.defineProperty(Structure.prototype, "containerWithEnergy", {
  get() {
    if (this.structureType === STRUCTURE_CONTAINER && this.hasEnergy) {
      return true;
    }
    return false;
  }
});
