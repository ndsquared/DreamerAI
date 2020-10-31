import { Figment } from "../figment";
import { Neuron } from "./neuron";
import { NeuronDream } from "./neuronDream";
import { NeuronHarvest } from "./neuronHarvest";

export abstract class Neurons {
  public static generateNeuron(figment: Figment, interneuron: Interneuron): Neuron {
    let neuron: Neuron;
    switch (interneuron.type) {
      case "HARVEST":
        neuron = new NeuronHarvest(figment, interneuron);
        break;
      default:
        neuron = new NeuronDream(figment, interneuron);
        break;
    }
    return neuron;
  }
}
