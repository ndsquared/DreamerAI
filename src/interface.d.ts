interface BuildQueuePayload {
  structure: StructureConstant;
  pos: RoomPosition;
  priority: number;
}

interface Coord {
  x: number;
  y: number;
}

interface Creep {
  travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
}

interface EnergyStructure extends Structure {
  energy: number;
  energyCapacity: number;
}

interface Figment {
  neurons: Interneuron[];
}

interface FigmentBodySpec {
  bodyParts: BodyPartConstant[];
  ratio: number[];
  minParts: number;
  maxParts: number;
}

interface IBrain {
  ponder(): void;
  think(): void;
  reflect(): void;
}

interface HasPos {
  pos: RoomPosition;
}

interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
}

interface RoomPosition {
  availableNeighbors(ignoreCreeps?: boolean): RoomPosition[];
  neighbors: RoomPosition[];
  hasAdjacentKeeper: boolean;
  isWalkable(ignoreCreeps: boolean): boolean;
  isVisible: boolean;
  isEdge: boolean;
}

interface SpawnQueuePayload {
  name: string;
  bodySpec: FigmentBodySpec;
  priority: number;
  thoughtName: string;
  thoughtInstance: number;
}

interface StoreStructure extends Structure {
  store: StoreDefinition;
}

interface Structure {
  isWalkable: boolean;
  hasCapacity: boolean;
  hasEnergy: boolean;
  containerWithEnergy: boolean;
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
