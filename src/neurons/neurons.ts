import { NeuronHarvest } from "./neuronHarvest";
import { NeuronDream } from "./neuronDream";
import { Figment } from "../figment";
import { Neuron } from "./neuron";

export abstract class Neurons {
  static generateNeuron(figment: Figment, interneuron: Interneuron) {
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
