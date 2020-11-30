import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

type transferTargetType = StoreStructure | EnergyStructure;

export class NeuronTransfer extends Neuron {
  public target!: transferTargetType;
  public resourceType: ResourceConstant | null = null;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    if (this.interneuron.target.options.resourceType) {
      this.resourceType = this.interneuron.target.options.resourceType;
    }
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (isStoreStructure(this.target)) {
      if (this.resourceType) {
        if (this.target.store.getFreeCapacity(this.resourceType) === 0) {
          return false;
        }
      } else {
        for (const resourceType in this.figment.store) {
          const freeCap = this.target.store.getFreeCapacity(resourceType as ResourceConstant);
          if (freeCap) {
            return true;
          }
        }
        return false;
      }
    } else if (isEnergyStructure(this.target)) {
      if (this.target.energy === this.target.energyCapacity) {
        return false;
      }
    }
    return true;
  }
  public impulse(): number {
    if (this.resourceType) {
      return this.figment.transfer(this.target, this.resourceType);
    }
    let result: number = OK;
    if (isEnergyStructure(this.target)) {
      const tempResult = this.figment.transfer(this.target, RESOURCE_ENERGY);
      if (tempResult !== OK) {
        result = tempResult;
      }
    } else {
      for (const resourceType in this.figment.store) {
        const resourceAmount = this.figment.store[resourceType as ResourceConstant];
        if (resourceAmount > 0) {
          const tempResult = this.figment.transfer(this.target, resourceType as ResourceConstant);
          if (tempResult !== OK) {
            result = tempResult;
          }
        }
      }
    }
    return result;
  }
}
