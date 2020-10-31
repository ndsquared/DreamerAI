import { Neuron } from "./neuron";

export class NeuronDream extends Neuron {
  public isValidNeuron(): boolean {
    return false;
  }
  public isValidTarget(): boolean {
    return false;
  }
  public impulse(): number {
    return global.ERR_INVALID_NEURON;
  }
}
