import "definitions/prototypes";
import { ErrorMapper } from "utils/errorMapper";
import { Imagination } from "imagination";
import profiler from "screeps-profiler";

// profiler.enable();
global.i = new Imagination();
global.resetMemory = false;

function mainLoop() {
  global.i.imagine();
}

export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(mainLoop);
});
