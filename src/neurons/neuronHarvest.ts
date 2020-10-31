import { Neuron } from "./neuron";
export class NeuronHarvest extends Neuron {
  target!: Source;
  isValidNeuron() {
    return this.figment.store.getFreeCapacity() > 0;
  }
  isValidTarget() {
    if (!(this.target instanceof Source)) {
      return false;
    }
    if (this.target.energy === 0) {
      return false;
    }
    return true;
  }
  impulse() {
    return this.figment.harvest(this.target);
  }
}
