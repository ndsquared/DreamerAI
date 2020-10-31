import { Figment } from "figment";

/*
Heavily inspired by https://github.com/bencbartlett/creep-tasks
*/
export abstract class Neuron {
  figment: Figment;
  type: string;
  interneuron: Interneuron;

  constructor(figment: Figment, interneuron: Interneuron) {
    this.figment = figment;
    this.interneuron = interneuron;
    this.type = interneuron.type;
  }

  protected get target(): RoomPosition | RoomObject {
    const roomObject = Game.getObjectById(this.interneuron.target.ref);
    if (roomObject && roomObject instanceof RoomObject) {
      return roomObject;
    }
    const roomPosition = new RoomPosition(
      this.interneuron.target.pos.x,
      this.interneuron.target.pos.y,
      this.interneuron.target.pos.roomName
    );
    return roomPosition;
  }

  abstract isValidNeuron(): boolean;

  abstract isValidTarget(): boolean;

  isValid() {
    return this.isValidNeuron() && this.isValidTarget();
  }

  abstract impulse(): number;

  run() {
    const impulseResult = this.impulse();
    if (impulseResult === ERR_NOT_IN_RANGE) {
      this.figment.travelTo(this.target);
    }
  }
}
