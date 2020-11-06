import { Figment } from "figment";
import { Neuron } from "./neuron";

export class NeuronHeal extends Neuron {
  public target!: Figment;
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
    if (this.figment.pos.isNearTo(this.target)) {
      return this.figment.heal(this.target);
    }
    return this.figment.travelTo(this.target);
  }
}
