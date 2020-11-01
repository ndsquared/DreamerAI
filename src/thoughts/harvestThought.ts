import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";

export class HarvestThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentBody = [WORK, WORK, CARRY, MOVE];
    const spawn = this.idea.spawn;
    if (spawn) {
      const sources = _.sortBy(
        Game.rooms[spawn.pos.roomName].find(FIND_SOURCES, { filter: s => !s.pos.hasAdjacentKeeper }),
        s => s.pos.findPathTo(spawn.pos).length
      );
      for (const source of sources) {
        const max = source.pos.availableNeighbors(true).length;
        this.figmentsNeeded += max;
      }
    }
    this.figmentsNeeded = _.min([this.figmentsNeeded, 6]);
    this.figmentInitFunc = figment => {
      const shouldDrop = this.figments.length > 2;
      const source = this.getSourceAssigment(figment);
      figment.assignHarvestNeuron(source, shouldDrop);
    };
    this.priorityFunc = () => {
      if (this.figments.length > 2) {
        this.figmentPriority = 8;
      } else {
        this.figmentPriority = 12;
      }
    };
  }

  private getSourceAssigment(figment: Figment): Source {
    const neighbors = figment.pos.neighbors;
    for (const pos of neighbors) {
      const look = pos.look();
      for (const lookObj of look) {
        if (lookObj.type === LOOK_SOURCES) {
          const adjSource = lookObj[LOOK_SOURCES];
          if (adjSource !== undefined) {
            // console.log("harvesting adj source");
            return adjSource;
          }
        }
      }
    }
    const source = _.first(
      _.sortBy(
        Game.rooms[figment.pos.roomName].find(FIND_SOURCES, {
          filter: s => s.pos.availableNeighbors(false).length > 0
        }),
        s => s.pos.findPathTo(figment.pos).length
      )
    );
    console.log("harvest closest source with available neighbors");
    return source;
  }
}
