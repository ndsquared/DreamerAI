interface Memory {
  imagination: { [name: string]: any };
}

interface CreepMemory {
  interneurons: Interneuron[];
}

interface Interneuron {
  type: string;
  target: {
    ref: string;
    x: number;
    y: number;
    roomName: string;
  };
}
