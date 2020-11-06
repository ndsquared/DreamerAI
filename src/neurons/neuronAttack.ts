import { Neuron } from "./neuron";

export class NeuronAttack extends Neuron {
  public target!: Creep;
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
    if (this.figment.pos.isNearTo(this.target)) {
      return this.figment.attack(this.target);
    }
    return this.figment.travelTo(this.target, { movingTarget: true });
  }
}
