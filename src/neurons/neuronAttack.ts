import { Figment } from "figment";
import { Neuron } from "./neuron";

export class NeuronAttack extends Neuron {
  public target!: Creep;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    this.interneuron.target.options.movingTarget = true;
  }
  public isValidNeuron(): boolean {
    return this.figment.getActiveBodyparts(ATTACK) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    return this.target.hits > 0;
  }
  public impulse(): number {
    return this.figment.attack(this.target);
  }
}
