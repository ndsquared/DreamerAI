import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronDrop extends Neuron {
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
  }
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
