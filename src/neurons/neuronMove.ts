import { Neuron } from "./neuron";

export class NeuronMove extends Neuron {
  public isValidNeuron(): boolean {
    if (this.figment.pos.inRangeTo(this.targetPos, 1) && !this.targetPos.availableToMove) {
      return false;
    }
    return !this.figment.pos.isEqualTo(this.targetPos);
  }
  public isValidTarget(): boolean {
    return true;
  }
  public impulse(): number {
    const result = this.figment.travelTo(this.targetPos);
    console.log(result);
    return result;
  }
}
