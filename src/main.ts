import "definitions/prototypes";
import { ErrorMapper } from "utils/errorMapper";
import { Imagination } from "imagination";
import profiler from "screeps-profiler";

// profiler.enable();
const imagination = new Imagination();

function mainLoop() {
  imagination.imagine();
}

export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(mainLoop);
});
