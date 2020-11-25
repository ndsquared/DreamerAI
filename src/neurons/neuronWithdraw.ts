import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

type withdrawTargetType = StoreStructure | EnergyStructure;

export class NeuronWithDraw extends Neuron {
  public target!: withdrawTargetType;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getFreeCapacity() > 0 && this.figment.getActiveBodyparts(CARRY) > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (isStoreStructure(this.target)) {
      if (this.target.store.getUsedCapacity() === 0) {
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
    let result: number = OK;
    if (isEnergyStructure(this.target)) {
      const tempResult = this.figment.withdraw(this.target, RESOURCE_ENERGY);
      if (tempResult !== OK) {
        result = tempResult;
      }
    } else {
      for (const resourceType in this.target.store) {
        const tempResult = this.figment.withdraw(this.target, resourceType as ResourceConstant);
        if (tempResult !== OK) {
          result = tempResult;
        }
      }
    }
    return result;
  }
}
