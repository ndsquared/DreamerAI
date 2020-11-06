import { Neuron } from "./neuron";

export class NeuronRangedHeal extends Neuron {
  public target!: Creep;
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
    this.figment.travelTo(this.target);
    return this.figment.rangedHeal(this.target);
  }
}
