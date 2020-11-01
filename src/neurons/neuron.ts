import { Figment } from "figment";

/*
Heavily inspired by https://github.com/bencbartlett/creep-tasks
*/
export abstract class Neuron {
  protected figment: Figment;
  protected interneuron: Interneuron;

  public constructor(figment: Figment, interneuron: Interneuron) {
    this.figment = figment;
    this.interneuron = interneuron;
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

  public isValid(): boolean {
    return this.isValidNeuron() && this.isValidTarget();
  }

  abstract impulse(): number;

  public run(): void {
    const impulseResult = this.impulse();
    if (impulseResult === ERR_NOT_IN_RANGE) {
      const result = this.figment.travelTo(this.target);
      if (result === global.ERR_INVALID_NEURON) {
        this.figment.memory.interneurons = [];
      }
    }
  }
}
