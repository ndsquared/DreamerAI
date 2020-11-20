interface Memory {
  version: number;
  imagination: ImaginationMemory;
  [name: string]: any;
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
  figmentType: string;
  thoughtType: string;
  thoughtInstance: string;
  interneurons: Interneuron[];
  underAttack: boolean;
  underAttackCooldown: number;
  combatReady: boolean;
  inCombat: boolean;
}

interface GenesisMemory {
  figmentCount: {
    [name: string]: number;
  };
}
interface MetabolicMemory {
  metabolism: MetabolismMemory;
}

interface MetabolismMemory {
  inputs: {
    [id: string]: MetabolismIO;
  };
  outputs: {
    [id: string]: MetabolismIO;
  };
}

interface MetabolismIO {
  [name: string]: {
    delta: number;
  };
}

interface ImaginationMemory {
  version: number;
  genesisIdeas: {
    [name: string]: GenesisMemory;
  };
  metabolicIdeas: {
    [name: string]: MetabolicMemory;
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
  sleepTicks: number;
}

interface RoomMemory {
  avoid: number;
}
