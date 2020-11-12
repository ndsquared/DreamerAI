import { Neuron } from "./neuron";

export class NeuronMove extends Neuron {
  public isValidNeuron(): boolean {
    return !this.figment.pos.inRangeTo(this.targetPos, this.interneuron.target.options.moveRange);
  }
  public isValidTarget(): boolean {
    if (this.figment.pos.inRangeTo(this.targetPos, 1) && !this.targetPos.isWalkable(false)) {
      return false;
    }
    return true;
  }
  public impulse(): number {
    const result = this.figment.travelTo(this.targetPos, { range: this.interneuron.target.options.moveRange });
    return result;
  }
}
