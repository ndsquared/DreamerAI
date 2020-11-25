import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronDrop extends Neuron {
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
    let result: number = OK;
    for (const resourceType in this.figment.store) {
      const tempResult = this.figment.drop(resourceType as ResourceConstant);
      if (tempResult !== OK) {
        result = tempResult;
      }
    }
    return result;
  }
}
