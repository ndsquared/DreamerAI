import { Figment } from "figments/figment";
import { Neuron } from "./neuron";

export class NeuronSleep extends Neuron {
  public constructor(figment: Figment, interneuron: Interneuron) {
    super(figment, interneuron);
    figment.memory.interneurons[0].target.options.sleepTicks--;
  }
  public isValidNeuron(): boolean {
    return this.interneuron.target.options.sleepTicks > 0;
  }
  public isValidTarget(): boolean {
    return true;
  }
  public impulse(): number {
    this.figment.say("zzZZzz");
    // console.log(`sleeping for ${this.interneuron.target.options.sleepTicks} tick(s)`);
    return OK;
  }
}
