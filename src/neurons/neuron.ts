import { NeuronDream } from "./neuronDream";

/*
Heavily inspired by https://github.com/bencbartlett/creep-tasks
*/
export abstract class Neuron {
  type: string;
  target: RoomPosition;

  constructor(type: string, target: RoomPosition) {
    this.type = type;
    this.target = target;
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
    }
  }

  static generateNeuron(interneuron: Interneuron) {
    const target = new RoomPosition(interneuron.target.x, interneuron.target.y, interneuron.target.roomName);
    return new NeuronDream(interneuron.type, target);
  }
}
