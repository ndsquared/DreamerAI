import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Neuron } from "./neuron";

type withdrawTargetType = StoreStructure | EnergyStructure;

export class NeuronWithDraw extends Neuron {
  public target!: withdrawTargetType;
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity() > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (isStoreStructure(this.target)) {
      if (this.target.store.getUsedCapacity(this.resourceType) === 0) {
        return false;
      }
    } else if (isEnergyStructure(this.target)) {
      if (this.target.energy === 0) {
        return false;
      }
    }
    return true;
  }
  public impulse(): number {
    return this.figment.withdraw(this.target, this.resourceType);
  }
}
