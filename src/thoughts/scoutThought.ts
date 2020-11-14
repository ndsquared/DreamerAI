import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { PathFindWithRoad } from "utils/misc";

export class ScoutThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.SCOUT] = [];
  }

  public handleFigment(figment: Figment): void {
    if (figment.room.name !== this.instance) {
      const targetPos = new RoomPosition(25, 25, this.instance);
      figment.addNeuron(NeuronType.MOVE, "", targetPos);
    } else {
      const mapExits = Game.map.describeExits(figment.room.name);
      for (const roomName of Object.values(mapExits)) {
        if (roomName) {
          const exitDir = figment.room.findExitTo(roomName);
          if (exitDir !== -2 && exitDir !== -10) {
            const exit = figment.pos.findClosestByRange(exitDir) as RoomPosition;
            if (exit) {
              figment.addNeuron(NeuronType.MOVE, "", exit);
              return;
            }
          }
        }
      }
    }
  }

  public figmentNeeded(figmentType: string): boolean {
    const targetPos = new RoomPosition(25, 25, this.instance);
    const pf = PathFindWithRoad(this.idea.spawn.pos, targetPos);
    if (pf.incomplete && pf.path.length > 0 && !pf.path[pf.path.length - 1].isEdge) {
      return false;
    } else {
      return this.figments[figmentType].length < 1;
    }
  }
}
