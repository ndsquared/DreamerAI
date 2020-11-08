interface CreepMemory {
  _trav: any;
  ideaName: string;
  thoughtName: string;
  thoughtInstance: string;
  interneurons: Interneuron[];
  underAttack: boolean;
  underAttackCooldown: number;
  combatReady: boolean;
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
  movingTarget: boolean;
}

interface Memory {
  imagination: ImaginationMemory;
  [name: string]: any;
}

interface RoomMemory {
  avoid: number;
}
