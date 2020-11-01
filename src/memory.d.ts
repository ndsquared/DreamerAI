interface CreepMemory {
  _trav: any;
  ideaName: string;
  thoughtName: string;
  thoughtInstance: number;
  interneurons: Interneuron[];
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
}

interface Memory {
  imagination: ImaginationMemory;
  [name: string]: any;
}

interface RoomMemory {
  avoid: number;
}
