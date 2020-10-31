import { Neuron } from "./neuron";

export class NeuronDream extends Neuron {
  isValidNeuron() {
    return false;
  }
  isValidTarget() {
    return false;
  }
  impulse() {
    return global.ERR_INVALID_NEURON;
  }
}
