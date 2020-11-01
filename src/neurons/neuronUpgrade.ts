import { Neuron } from "./neuron";
export class NeuronUpgrade extends Neuron {
  public target!: StructureController;
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0 && this.figment.getActiveBodyparts(WORK) > 0;
  }
  public isValidTarget(): boolean {
    if (!(this.target instanceof StructureController)) {
      return false;
    }
    return true;
  }
  public impulse(): number {
    return this.figment.upgradeController(this.target);
  }
}
