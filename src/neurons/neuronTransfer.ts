import { isEnergyStructure, isStoreStructure } from "utils/misc";
import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

type transferTargetType = StoreStructure | EnergyStructure;

export class NeuronTransfer extends Neuron {
  public target!: transferTargetType;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0;
  }
  public isValidTarget(): boolean {
    if (!this.target) {
      return false;
    }
    if (isStoreStructure(this.target)) {
      if (this.target.store.getFreeCapacity() === 0) {
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
    let result: number = OK;
    for (const resourceType in this.figment.store) {
      const resourceAmount = this.figment.store[resourceType as ResourceConstant];
      if (resourceAmount > 0) {
        const tempResult = this.figment.transfer(this.target, resourceType as ResourceConstant);
        if (tempResult !== OK) {
          result = tempResult;
        }
      }
    }
    return result;
  }
}
