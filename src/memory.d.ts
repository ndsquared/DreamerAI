interface CreepMemory {
  _trav: any;
  ideaName: string;
  thoughtName: string;
  thoughtInstance: number;
  interneurons: Interneuron[];
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
  };
}

interface Memory {
  [name: string]: any;
}

interface RoomMemory {
  avoid: number;
}
