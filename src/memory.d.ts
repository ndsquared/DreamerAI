interface Memory {
  stats: Stats;
}

interface Stats {
  time: number;
  gcl: {
    [name: string]: number;
  };
  rooms: {
    [name: string]: RoomStats;
  };
  cpu: {
    [name: string]: number;
  };
}

interface RoomStats {
  [name: string]: number;
}

interface CreepMemory {
  _trav: any;
  ideaName: string;
  thoughtName: string;
  thoughtInstance: string;
  interneurons: Interneuron[];
  underAttack: boolean;
  underAttackCooldown: number;
  combatReady: boolean;
  inCombat: boolean;
  spawnRoomName: string;
}

interface IdeaMemory {
  figmentCount: {
    [name: string]: number;
  };
}

interface ImaginationMemory {
  ideas: {
    [name: string]: IdeaMemory;
  };
}

interface Interneuron {
  type: string;
  target: {
    ref: string;
    pos: {
      x: number;
      y: number;
      roomName: string;
    };
    options: InterneuronTargetOptions;
  };
}

interface InterneuronTargetOptions {
  ignoreFigmentCapacity: boolean;
  targetRange: number;
  moveOffRoadDuringImpulse: boolean;
  moveRange: number;
  moveRandom: boolean;
  movingTarget: boolean;
}

interface Memory {
  imagination: ImaginationMemory;
  [name: string]: any;
}

interface RoomMemory {
  avoid: number;
}
