# Imagination

The `imagination` will be the main entrypoint for this AI. It will contain `ideas`. An `idea` will be high-level objective (i.e. bootstrapping a room, expansion, warfare). An idea will contain `thoughts`. A `thought` will be a lower-level objective (i.e. get energy from sources in a room, upgrade a controller).

The `imagination`, `idea`, and `thought` classes will all implement three functions that will be executed every game tick:

- `ponder` -> Execute any computations needed for the `think` phase. Rebuild necessary objects from memory.
- `think` -> Execute actions to achieve the objective for an `idea` or `thought`
- `reflect` -> Perform any clean up operations. Perform any additional actions
