interface Memory {
  imagination: { [name: string]: any };
}

interface CreepMemory {
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
