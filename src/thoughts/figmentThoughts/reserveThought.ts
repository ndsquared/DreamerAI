import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class ReserveThought extends FigmentThought {
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.RESERVE] = [];
  }

  public handleFigment(figment: Figment): boolean {
    const room = Game.rooms[this.instance];
    if (room) {
      const controller = room.controller;
      if (controller) {
        figment.addNeuron(NeuronType.RESERVE, controller.id, controller.pos);
      }
    } else {
      const targetPos = new RoomPosition(25, 25, this.instance);
      figment.addNeuron(NeuronType.MOVE, "", targetPos);
    }
    return true;
  }

  public figmentNeeded(figmentType: string): boolean {
    if (this.idea.rcl < 3) {
      return false;
    }
    // TODO: Set parts lower when controller is above reserve threshold
    const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(CLAIM));
    return totalParts < 2;
  }
}
