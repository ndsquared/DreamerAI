import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

type withdrawTargetType = StoreStructure | EnergyStructure;

export class NeuronWithDraw extends Neuron {
  public target!: withdrawTargetType;
  public resourceType: ResourceConstant | null = null;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    if (this.interneuron.target.options.resourceType) {
      this.resourceType = this.interneuron.target.options.resourceType;
    }
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity() > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (isStoreStructure(this.target)) {
      if (this.resourceType) {
        if (this.target.store.getUsedCapacity(this.resourceType) === 0) {
          return false;
        }
      } else {
        for (const resourceType in this.target.store) {
          if (this.target.store.getUsedCapacity(resourceType as ResourceConstant) === 0) {
            return false;
          }
        }
      }
    } else if (isEnergyStructure(this.target)) {
      if (this.target.energy === 0) {
        return false;
      }
    }
    return true;
  }
  public impulse(): number {
    if (this.resourceType) {
      return this.figment.withdraw(this.target, this.resourceType);
    }
    let result: number = OK;
    if (isEnergyStructure(this.target)) {
      const tempResult = this.figment.withdraw(this.target, RESOURCE_ENERGY);
      // console.log(`withdraw -> ${RESOURCE_ENERGY}: ${tempResult}`);
      if (tempResult !== OK) {
        result = tempResult;
      }
    } else {
      for (const resourceType in this.target.store) {
        const tempResult = this.figment.withdraw(this.target, resourceType as ResourceConstant);
        // console.log(`withdraw -> ${resourceType}: ${tempResult}`);
        if (tempResult !== OK) {
          result = tempResult;
        }
      }
    }
    return result;
  }
}
