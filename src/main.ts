import "declarations/prototypes";
import { ErrorMapper } from "utils/ErrorMapper";
import { Imagination } from "imagination";
import profiler from "screeps-profiler";

const imagination = new Imagination();

function mainLoop() {
  imagination.imagine();
}

export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(mainLoop);
});
