// memory extension
interface CreepMemory {
  role: string;
  room: string;
  working: boolean;
}

interface Memory {
  uuid: number;
  log: any;
}

// `global` extension
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
