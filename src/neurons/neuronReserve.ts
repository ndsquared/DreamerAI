import { Neuron } from "./neuron";

export class NeuronReserve extends Neuron {
  public target!: StructureController;
  public isValidNeuron(): boolean {
    return this.figment.getActiveBodyparts(CLAIM) > 0;
  }
  public isValidTarget(): boolean {
    return this.target instanceof StructureController;
  }
  public impulse(): number {
    let result = this.figment.reserveController(this.target);
    if (result === ERR_INVALID_TARGET) {
      result = this.figment.attackController(this.target);
    }
    return result;
  }
}
