import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronPickup extends Neuron {
  public target!: Resource;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity() > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    return this.target && this.target.amount > 0;
  }
  public impulse(): number {
    return this.figment.pickup(this.target);
  }
}
