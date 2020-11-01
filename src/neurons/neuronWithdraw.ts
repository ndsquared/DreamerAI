import { Neuron } from "./neuron";
import { isStoreStructure } from "utils/misc";

type withdrawTargetType = StructureSpawn;

export class NeuronWithDraw extends Neuron {
  public target!: withdrawTargetType;
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity() > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    if (this.target instanceof isStoreStructure)
      if (this.target.store.getUsedCapacity() === 0) {
        return false;
      }
    return true;
  }
  public impulse(): number {
    return this.figment.withdraw(this.target, this.resourceType);
  }
}
