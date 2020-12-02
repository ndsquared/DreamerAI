import { Figment } from "figments/figment";
import { FigmentThought } from "./figmentThought";
import { FigmentThoughtType } from "../thought";
import { Idea } from "ideas/idea";
import { NeuronType } from "neurons/neurons";
import { Traveler } from "utils/traveler";

export class ReserveThought extends FigmentThought {
  private withinMinDist = false;
  public constructor(idea: Idea, type: FigmentThoughtType, instance: string) {
    super(idea, type, instance);
    this.figments[FigmentThoughtType.RESERVE] = [];
    if (Traveler.routeDistance(this.idea.roomName, this.instance) === 2) {
      this.withinMinDist = true;
    }
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
    if (this.idea.baseRoomObjects.extensions.length < 10 || !this.withinMinDist) {
      return false;
    }
    const room = Game.rooms[this.instance];
    // TODO: Set parts lower when controller is above reserve threshold
    if (room && room.controller) {
      const totalParts = _.sum(this.figments[figmentType], f => f.getActiveBodyparts(CLAIM));
      const availablePos = room.controller.pos.availableAdjacentPositions(true);
      if (totalParts < 2 && this.figments[figmentType].length < availablePos.length) {
        return true;
      }
    }
    return false;
  }
}
