import { Neuron } from "./neuron";
import { isStoreStructure } from "utils/misc";

type transferTargetType = StructureSpawn;

export class NeuronTransfer extends Neuron {
  public target!: transferTargetType;
  private resourceType: ResourceConstant = RESOURCE_ENERGY;
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity() > 0;
  }
  public isValidTarget(): boolean {
    if (this.target instanceof isStoreStructure)
      if (this.target.energy === 0) {
        return false;
      }
    return true;
  }
  public impulse(): number {
    return this.figment.transfer(this.target, this.resourceType);
  }
}
