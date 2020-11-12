import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronHeal extends Neuron {
  public target!: Figment;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    this.interneuron.target.options.movingTarget = true;
  }
  public isValidNeuron(): boolean {
    return this.figment.getActiveBodyparts(HEAL) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    return this.target.hits < this.target.hitsMax;
  }
  public impulse(): number {
    return this.figment.heal(this.target);
  }
}
