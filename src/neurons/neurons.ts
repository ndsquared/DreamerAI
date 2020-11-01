import { Figment } from "../figment";
import { Neuron } from "./neuron";
import { NeuronDream } from "./neuronDream";
import { NeuronDrop } from "./neuronDrop";
import { NeuronHarvest } from "./neuronHarvest";
import { NeuronPickup } from "./neuronPickup";
import { NeuronTransfer } from "./neuronTransfer";

export enum NeuronType {
  DREAM = "DREAM",
  HARVEST = "HARVEST",
  DROP = "DROP",
  TRANSFER = "TRANSFER",
  PICKUP = "PICKUP"
}
export abstract class Neurons {
  public static generateNeuron(figment: Figment, interneuron: Interneuron): Neuron {
    let neuron: Neuron;
    switch (interneuron.type) {
      case NeuronType.HARVEST:
        neuron = new NeuronHarvest(figment, interneuron);
        break;
      case NeuronType.DROP:
        neuron = new NeuronDrop(figment, interneuron);
        break;
      case NeuronType.TRANSFER:
        neuron = new NeuronTransfer(figment, interneuron);
        break;
      case NeuronType.PICKUP:
        neuron = new NeuronPickup(figment, interneuron);
        break;
      default:
        neuron = new NeuronDream(figment, interneuron);
        break;
    }
    return neuron;
  }
}
