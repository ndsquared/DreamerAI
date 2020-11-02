import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Neuron } from "./neuron";

type transferTargetType = StoreStructure | EnergyStructure;

export class NeuronTransfer extends Neuron {
  public target!: transferTargetType;
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (isStoreStructure(this.target)) {
      if (this.target.store.getFreeCapacity(this.resourceType) === 0) {
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
    return this.figment.transfer(this.target, this.resourceType);
  }
}
