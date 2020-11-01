interface Coord {
  x: number;
  y: number;
}
interface HasPos {
  pos: RoomPosition;
}

interface Creep {
  travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
}

interface IBrain {
  ponder(): void;
  think(): void;
  reflect(): void;
}

interface Figment {
  neurons: Interneuron[];
}

interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
}

interface RoomPosition {
  availableNeighbors(ignoreCreeps: boolean): RoomPosition[];
  neighbors: RoomPosition[];
  hasAdjacentKeeper: boolean;
  isWalkable(ignoreCreeps: boolean): boolean;
  isVisible: boolean;
}

interface SpawnQueuePayload {
  name: string;
  body: BodyPartConstant[];
  priority: number;
  thoughtName: string;
  thoughtInstance: number;
}

interface Structure {
  isWalkable: boolean;
  hasCapacity: boolean;
  hasEnergy: boolean;
}

interface TravelToReturnData {
  nextPos?: RoomPosition;
  pathfinderReturn?: PathfinderReturn;
  state?: TravelState;
  path?: string;
}

interface TravelToOptions {
  ignoreRoads?: boolean;
  ignoreCreeps?: boolean;
  ignoreStructures?: boolean;
  preferHighway?: boolean;
  highwayBias?: number;
  allowHostile?: boolean;
  allowSK?: boolean;
  range?: number;
  obstacles?: { pos: RoomPosition }[];
  roomCallback?: (roomName: string, matrix: CostMatrix) => CostMatrix | boolean;
  routeCallback?: (roomName: string) => number;
  returnData?: TravelToReturnData;
  restrictDistance?: number;
  useFindRoute?: boolean;
  maxOps?: number;
  movingTarget?: boolean;
  freshMatrix?: boolean;
  offRoad?: boolean;
  stuckValue?: number;
  maxRooms?: number;
  repath?: number;
  route?: { [roomName: string]: boolean };
  ensurePath?: boolean;
}

interface TravelData {
  state: any[];
  path: string;
}

interface TravelState {
  stuckCount: number;
  lastCoord: Coord;
  destination: RoomPosition;
  cpu: number;
}
