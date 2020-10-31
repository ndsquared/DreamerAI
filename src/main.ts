import "prototypes";
import { ErrorMapper } from "utils/ErrorMapper";
import { Imagination } from "imagination";

const imagination = new Imagination();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  imagination.imagine();
});
