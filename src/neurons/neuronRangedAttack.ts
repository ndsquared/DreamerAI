import { Figment } from "figment";
import { Neuron } from "./neuron";

export class NeuronRangedAttack extends Neuron {
  public target!: Creep;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    this.interneuron.target.options.movingTarget = true;
  }
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
    if (this.figment.getActiveBodyparts(HEAL) > 0) {
      const hurtFigments = this.figment.pos.findInRange(FIND_MY_CREEPS, 3, {
        filter: f => {
          if (f.hits / f.hitsMax < 0.5) {
            return true;
          }
          return false;
        }
      });
      if (hurtFigments) {
        const closestHurtFigment = _.first(_.sortBy(hurtFigments, f => this.figment.pos.getRangeTo(f.pos)));
        this.figment.rangedHeal(closestHurtFigment);
      }
    }
    return this.figment.rangedAttack(this.target);
  }
}
