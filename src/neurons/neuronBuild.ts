import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronBuild extends Neuron {
  public target!: ConstructionSite;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    this.interneuron.target.options.targetRange = 3;
    this.interneuron.target.options.moveOffRoadDuringImpulse = true;
    this.interneuron.target.options.moveRandom = true;
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && this.figment.getActiveBodyparts(WORK) > 0;
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
