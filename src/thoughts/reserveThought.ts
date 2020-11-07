import { Figment } from "figment";
import { FigmentThought } from "./figmentThought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";

export class ReserveThought extends FigmentThought {
  public constructor(idea: Idea, name: string, instance: string) {
    super(idea, name, instance);
    this.figmentsNeeded = 1;
    this.figmentBodySpec = {
      bodyParts: [CLAIM],
      ratio: [1],
      minParts: 2,
      maxParts: 8,
      ignoreCarry: false
    };
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

  public adjustPriority(): void {
    this.figmentPriority = 1;
  }
}
