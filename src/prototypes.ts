import { Traveler } from "./utils/traveler";

// Creep
Creep.prototype.travelTo = function (destination: RoomPosition | { pos: RoomPosition }, options?: TravelToOptions) {
  return Traveler.travelTo(this, destination, options);
};

// RoomPosition
Object.defineProperty(RoomPosition.prototype, "neighbors", {
  get: function () {
    let adjPos: RoomPosition[] = [];
    for (let dx of [-1, 0, 1]) {
      for (let dy of [-1, 0, 1]) {
        if (!(dx == 0 && dy == 0)) {
          let x = this.x + dx;
          let y = this.y + dy;
          if (0 < x && x < 49 && 0 < y && y < 49) {
            adjPos.push(new RoomPosition(x, y, this.roomName));
          }
        }
      }
    }
    return adjPos;
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
