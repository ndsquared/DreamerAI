import { Neuron } from "./neuron";
export class NeuronHarvest extends Neuron {
  public target!: Source;
  public isValidNeuron(): boolean {
    if (this.figment.getActiveBodyparts(WORK) > 0) {
      return false;
    }
    if (this.interneuron.target.options.ignoreFigmentCapacity) {
      return true;
    }
    return this.figment.store.getFreeCapacity() > 0;
  }
  public isValidTarget(): boolean {
    if (!(this.target instanceof Source)) {
      return false;
    }
    if (this.target.energy === 0) {
      return false;
    }
    return true;
  }
  public impulse(): number {
    return this.figment.harvest(this.target);
  }
}
