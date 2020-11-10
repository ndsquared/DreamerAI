import { Figment } from "figment";
import { Neuron } from "./neuron";

export class NeuronRepair extends Neuron {
  public target!: Structure;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    this.interneuron.target.options.targetRange = 3;
    this.interneuron.target.options.moveOffRoadDuringImpulse = true;
    this.interneuron.target.options.moveRandom = true;
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0 && this.figment.getActiveBodyparts(WORK) > 0;
  }
  public isValidTarget(): boolean {
    if (!(this.target instanceof Structure)) {
      return false;
    }
    if (this.target.hits === this.target.hitsMax) {
      return false;
    }
    return true;
  }
  public impulse(): number {
    return this.figment.repair(this.target);
  }
}
