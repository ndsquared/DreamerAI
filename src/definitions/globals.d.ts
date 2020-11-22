declare namespace NodeJS {
  interface Global {
    i: import("../imagination").Imagination;
    resetMemory: boolean;
  }
}
