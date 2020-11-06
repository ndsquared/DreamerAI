import { Neuron } from "./neuron";

export class NeuronRangedAttack extends Neuron {
  public target!: Creep;
  public isValidNeuron(): boolean {
    return this.figment.getActiveBodyparts(RANGED_ATTACK) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    return this.target.hits > 0;
  }
  public impulse(): number {
    this.figment.travelTo(this.target, { movingTarget: true });
    return this.figment.rangedAttack(this.target);
  }
}
