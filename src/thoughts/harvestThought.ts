import { Thought } from "./thought";
import { Idea } from "ideas/idea";
import { Figment } from "../figment";

export class HarvestThought extends Thought {
  constructor(idea: Idea, name: string, instance: number) {
    super(idea, name, instance);
    this.figmentsNeeded = 3;
    this.figmentInitFunc = figment => {
      const source = this.getClosestSource(figment);
      figment.assignHarvestNeuron(source);
    };
  }

  private getClosestSource(figment: Figment) {
    const source = _.first(
      _.sortBy(
        Game.rooms[figment.pos.roomName].find(FIND_SOURCES, { filter: s => !s.pos.hasAdjacentKeeper }),
        s => s.pos.findPathTo(figment.pos, { ignoreCreeps: true }).length
      )
    );
    return source;
  }
}
