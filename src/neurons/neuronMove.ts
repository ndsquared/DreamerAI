import { Neuron } from "./neuron";

export class NeuronMove extends Neuron {
  public isValidNeuron(): boolean {
    return !this.figment.pos.inRangeTo(this.targetPos, this.interneuron.target.options.moveRange);
  }
  public isValidTarget(): boolean {
    return true;
  }
  public impulse(): number {
    const result = this.figment.travelTo(this.targetPos);
    return result;
  }
}
