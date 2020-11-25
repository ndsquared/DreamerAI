import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronUpgrade extends Neuron {
  public target!: StructureController;
  private resourceType: ResourceConstant;
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    this.interneuron.target.options.targetRange = 3;
    this.interneuron.target.options.moveOffRoadDuringImpulse = true;
    this.interneuron.target.options.moveRandom = true;
    this.resourceType = interneuron.target.options.resourceType;
  }
  public isValidNeuron(): boolean {
    return this.figment.store.getUsedCapacity(this.resourceType) > 0 && this.figment.getActiveBodyparts(WORK) > 0;
  }
  public isValidTarget(): boolean {
    if (!(this.target instanceof StructureController)) {
      return false;
    }
    return true;
  }
  public impulse(): number {
    return this.figment.upgradeController(this.target);
  }
}
