import { FigmentThought, FigmentType } from "./figmentThought";
import { Figment } from "figments/figment";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class ReserveThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figments[FigmentType.RESERVE] = [];
  }

  public handleFigment(figment: Figment): void {
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
