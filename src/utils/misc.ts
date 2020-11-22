export function ShuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function isStoreStructure(structure: Structure | RoomObject): structure is StoreStructure {
  return (structure as StoreStructure).store !== undefined;
}

export function isEnergyStructure(structure: Structure): structure is EnergyStructure {
  return (structure as EnergyStructure).energy !== undefined;
}

// TODO: need to reuse this cost matrix
const callback = (roomName: string): CostMatrix | boolean => {
  const room = Game.rooms[roomName];
  if (!room) return false;
  const costs = new PathFinder.CostMatrix();

  room.find(FIND_STRUCTURES).forEach(function (struct) {
    if (struct.structureType === STRUCTURE_ROAD) {
      costs.set(struct.pos.x, struct.pos.y, 1);
    } else if (
      struct.structureType !== STRUCTURE_CONTAINER &&
      (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
    ) {
      costs.set(struct.pos.x, struct.pos.y, 0xff);
    }
  });

  return costs;
};

export function PathFindWithRoad(originPos: RoomPosition, dstPos: RoomPosition): PathFinderPath {
  const pathFind = PathFinder.search(
    originPos,
    { pos: dstPos, range: 1 },
    {
      plainCost: 2,
      swampCost: 10,
      roomCallback: callback
    }
  );
  return pathFind;
}

export function RandomRoomPos(room: Room): RoomPosition {
  const ranX = _.random(0, 49);
  const ranY = _.random(0, 49);
  return new RoomPosition(ranX, ranY, room.name);
}

export function RandomRoomPatrolPos(room: Room): RoomPosition {
  const exits = Game.map.describeExits(room.name);
  if (!exits) {
    return RandomRoomPos(room);
  }
  const exitDirs = _.map(Object.keys(exits));
  const randomDir = exitDirs[_.random(0, exitDirs.length - 1)];
  let ranX = _.random(0, 49);
  let ranY = _.random(0, 49);
  switch (randomDir) {
    case "1":
      ranY = 0;
      break;
    case "3":
      ranX = 49;
      break;
    case "5":
      ranY = 49;
      break;
    case "7":
      ranX = 0;
      break;
    default:
      break;
  }
  return new RoomPosition(ranX, ranY, room.name);
}

export function GetRoomPosition(x: number, y: number, roomName: string): RoomPosition | null {
  if (x < 0 || x > 49 || y < 0 || y > 49) {
    return null;
  }
  return new RoomPosition(x, y, roomName);
}
/*
https://github.com/bencbartlett/Overmind/blob/3ed32276950a2015b3a6c75dfd80e3e58629847d/src/utilities/utils.ts
*/
export function getUsername(): string {
  for (const i in Game.rooms) {
    const room = Game.rooms[i];
    if (room.controller && room.controller.my) {
      if (room.controller.owner) {
        return room.controller.owner.username;
      }
    }
  }
  for (const i in Game.creeps) {
    const creep = Game.creeps[i];
    if (creep.owner) {
      return creep.owner.username;
    }
  }
  console.log("ERROR: Could not determine username");
  return "error: invalidusername";
}

export function getNeighborRoomNames(originRoomName: string): string[] {
  const adjRoomNames: string[] = [];

  const exits = Game.map.describeExits(originRoomName);
  if (exits) {
    for (const roomName of Object.values(exits)) {
      if (roomName) {
        adjRoomNames.push(roomName);
      }
    }
  }

  return adjRoomNames;
}

export function getReconRoomData(srcRoom: string, dstRoom: string): RoomMemory {
  const avoid = false;
  const isSourceKeeperOwned = false;
  const isInNeighborhood = Game.map.getRoomLinearDistance(srcRoom, dstRoom) <= 3;
  const expansionScore = -1;
  const attackScore = -1;
  const defendScore = -1;
  const harassScore = -1;
  return {
    avoid,
    isSourceKeeperOwned,
    isInNeighborhood,
    expansionScore,
    attackScore,
    defendScore,
    harassScore
  };
}

/*
https://github.com/screepers/screeps-snippets/blob/master/src/misc/JavaScript/Check%20if%20room%20is%20a%20source%20keeper%20room.js
*/

export function isSourceKeeperRoom(roomName: string): boolean {
  const regExResult = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
  if (regExResult) {
    const fMod = parseInt(regExResult[1], 10) % 10;
    const sMod = parseInt(regExResult[2], 10) % 10;
    const isSK = !(fMod === 5 && sMod === 5) && fMod >= 4 && fMod <= 6 && sMod >= 4 && sMod <= 6;
    return isSK;
  }
  return false;
}
