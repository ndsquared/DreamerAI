import { Neuron } from "./neuron";

export class NeuronPickup extends Neuron {
  public target!: Resource;
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity() > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    return this.target && this.target.amount > 0;
  }
  public impulse(): number {
    return this.figment.pickup(this.target);
  }
}
