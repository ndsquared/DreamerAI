interface BuildQueuePayload {
  structure: StructureConstant;
  pos: RoomPosition;
  priority: number;
}

interface BarGraphData {
  label: string;
  current: number;
  max: number;
}

interface Coord {
  x: number;
  y: number;
}

interface CortexRoomObjects {
  enemyCreeps: Creep[];
  myCreeps: Creep[];
  structures: Structure[];
  constructionSites: ConstructionSite[];
  resources: Resource[];
  sources: Source[];
}

interface EnergyStructure extends Structure {
  energy: number;
  energyCapacity: number;
}

interface EnemyQueuePayload {
  enemyObject: Creep | Structure;
  priority: number;
}

interface Figment {
  neurons: Interneuron[];
}

interface FigmentSpec {
  combatReady: boolean;
  bodySpec: FigmentBodySpec;
}

interface FigmentBodySpec {
  bodyParts: BodyPartConstant[];
  ratio: number[];
  minParts: number;
  maxParts: number;
  ignoreCarry: boolean;
  roadTravel: boolean;
}

interface FigmentCountAdjustment {
  type: string;
  delta: number;
}

interface HippocampusBaseRoom {
  roomName: string;
  showStats: boolean;
  showBuildVisuals: boolean;
  showMetaVisuals: boolean;
  showEnemyVisuals: boolean;
  showMapVisuals: boolean;
}

interface HealQueuePayload {
  figment: Creep;
  priority: number;
}

interface IBrain {
  ponder(): void;
  think(): void;
  reflect(): void;
}

interface HasPos {
  pos: RoomPosition;
}

interface MaterialColor {
  [color: string]: {
    [variant: string]: string;
  };
}

interface MetabolicQueuePayload {
  id: string;
  pos: {
    x: number;
    y: number;
    roomName: string;
  };
  priority: number;
}

interface MapTerritoryPayload {
  roomNames: string[];
  text: string;
  color: string;
}

interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
}

interface RoomPosition {
  availableAdjacentPositions(ignoreCreeps?: boolean): RoomPosition[];
  availableAdjacentBuilds(ignoreRoads?: boolean, ignoreRamparts?: boolean): RoomPosition[];
  adjacentPositions: RoomPosition[];
  hasStructure(structure: StructureConstant): boolean;
  isWalkable(ignoreCreeps: boolean): boolean;
  isBuildable(ignoreRaods?: boolean, ignoreRamparts?: boolean): boolean;
  isVisible: boolean;
  isEdge: boolean;
  toString(): string;
}

interface SpawnQueuePayload {
  figmentName: string;
  thoughtType: string;
  thoughtInstance: string;
  figmentSpec: FigmentSpec;
  figmentType: string;
  priority: number;
}

interface StoreStructure extends Structure {
  store: StoreDefinition;
}

interface Structure {
  isWalkable: boolean;
  hasEnergyCapacity: boolean;
  hasEnergy: boolean;
  containerWithEnergy: boolean;
}

interface ClosestTarget {
  resourceType?: ResourceConstant;
  minCapacity?: number;
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
  showVisuals?: boolean;
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
