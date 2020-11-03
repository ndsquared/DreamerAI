import { Neuron } from "./neuron";

export class NeuronClaim extends Neuron {
  public target!: StructureController;
  public isValidNeuron(): boolean {
    return this.figment.getActiveBodyparts(CLAIM) > 0;
  }
  public isValidTarget(): boolean {
    return this.target instanceof StructureController;
  }
  public impulse(): number {
    let result = this.figment.claimController(this.target);
    if (result === ERR_GCL_NOT_ENOUGH) {
      result = this.figment.reserveController(this.target);
    }
    return result;
  }
}
