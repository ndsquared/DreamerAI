import { Neuron } from "./neuron";
export class NeuronDrop extends Neuron {
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0;
  }
  public isValidTarget(): boolean {
    return true;
  }
  public impulse(): number {
    return this.figment.drop(this.resourceType);
  }
}
