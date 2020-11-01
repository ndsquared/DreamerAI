import { Neuron } from "./neuron";
export class NeuronBuild extends Neuron {
  public target!: ConstructionSite;
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0 && this.figment.getActiveBodyparts(WORK) > 0;
  }
  public isValidTarget(): boolean {
    if (!(this.target instanceof ConstructionSite)) {
      return false;
    }
    if (this.target.progress === this.target.progressTotal) {
      return false;
    }
    return true;
  }
  public impulse(): number {
    return this.figment.build(this.target);
  }
}