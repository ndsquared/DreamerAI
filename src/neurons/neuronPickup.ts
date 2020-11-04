import { Figment } from "figment";
import { Neuron } from "./neuron";

export class NeuronPickup extends Neuron {
  public target!: Resource;
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity(this.resourceType) > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (this.interneuron.target.options.minCapacity) {
      return this.target.amount > this.figment.store.getFreeCapacity(this.resourceType);
    }
    return this.target && this.target.amount > 0;
  }
  public impulse(): number {
    return this.figment.pickup(this.target);
  }
}
