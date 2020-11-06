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
