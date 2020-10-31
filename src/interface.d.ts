interface IBrain {
  ponder(): void;
  think(): void;
  reflect(): void;
}

interface Figment {
  neurons: Interneuron[];
}

interface SpawnQueuePayload {
  name: string;
  body: BodyPartConstant[];
  priority: number;
  thoughtName: string;
  thoughtInstance: number;
}

interface RoomPosition {
  neighbors: RoomPosition[];
  hasAdjacentKeeper: boolean;
}
